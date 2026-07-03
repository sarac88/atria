import { ForbiddenException, Injectable } from "@nestjs/common";
import type { ConversationDto, MessageDto } from "@atria/types";
import { PrismaService } from "../prisma/prisma.service";
import { toConversationDto, toMessageDto } from "../common/mappers";

const PARTICIPANT_INCLUDE = {
  participants: { include: { user: { select: { id: true, name: true, role: true } } } },
  messages: { orderBy: { createdAt: "desc" as const }, take: 1 },
};

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string): Promise<ConversationDto[]> {
    const parts = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      include: { conversation: { include: PARTICIPANT_INCLUDE } },
    });

    const withMeta = await Promise.all(
      parts.map(async (p) => {
        const unread = await this.prisma.message.count({
          where: {
            conversationId: p.conversationId,
            senderId: { not: userId },
            ...(p.lastReadAt ? { createdAt: { gt: p.lastReadAt } } : {}),
          },
        });
        const lastAt = p.conversation.messages[0]?.createdAt ?? p.conversation.createdAt;
        return { conversation: p.conversation, unread, lastAt };
      }),
    );

    withMeta.sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
    return withMeta.map((x) => toConversationDto(x.conversation, userId, x.unread));
  }

  async getMessages(userId: string, conversationId: string): Promise<MessageDto[]> {
    const part = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!part) throw new ForbiddenException();

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
    // Marcar como leída al abrir.
    await this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });
    return messages.map((m) => toMessageDto(m, userId));
  }
}
