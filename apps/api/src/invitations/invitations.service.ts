import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { randomBytes } from "crypto";
import * as argon2 from "argon2";
import type {
  AcceptInvitationInput,
  AcceptInvitationResultDto,
  ClassInvitationDto,
  InvitationPreviewDto,
  InvitationStatus,
  InviteStudentsInput,
  InviteStudentsResultDto,
} from "@atria/types";
import type { Class, ClassInvitation, User } from "@prisma/client";
import { AuthService, type IssuedTokens } from "../auth/auth.service";
import type { AuthUser } from "../auth/decorators";
import { toUserDto } from "../common/mappers";
import { invitationEmail } from "../mail/invitation-email";
import { MailService } from "../mail/mail.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";

/** Días que un enlace de invitación sigue siendo válido. */
const TTL_DAYS = 7;

const expiry = () => new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000);
const newToken = () => randomBytes(24).toString("base64url");
const invitePath = (token: string) => `/invitacion/${token}`;

/** Origen del frontend, donde vive la pantalla que acepta la invitación. */
function webOrigin(): string {
  const raw = process.env.APP_URL ?? process.env.CORS_ORIGIN ?? "http://localhost:3000";
  return raw.split(",")[0].trim().replace(/\/$/, "");
}

/** El estado `expired` no se guarda: se deriva de la fecha de caducidad al leer. */
function statusOf(inv: ClassInvitation): InvitationStatus {
  if (inv.status === "accepted") return "accepted";
  return inv.expiresAt.getTime() < Date.now() ? "expired" : "pending";
}

/** Normaliza y deduplica los correos del formulario conservando el orden. */
function normalizeEmails(emails: string[]): string[] {
  const seen = new Set<string>();
  for (const email of emails) seen.add(email.trim().toLowerCase());
  return [...seen];
}

/** La clase con el nombre del docente, que firma el correo de invitación. */
type ClassWithOwner = Class & { owner: { name: string } };

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly notifications: NotificationsService,
    private readonly mail: MailService,
  ) {}

  /** POST /classes/:id/invitations — crea (o renueva) una invitación por correo. */
  async invite(
    user: AuthUser,
    classId: string,
    input: InviteStudentsInput,
  ): Promise<InviteStudentsResultDto> {
    const cls = await this.assertTeacher(user, classId);
    const created: { invitation: ClassInvitation; accountId: string | null }[] = [];
    const skipped: { email: string; reason: string }[] = [];

    for (const email of normalizeEmails(input.emails)) {
      const account = await this.prisma.user.findUnique({ where: { email } });
      if (account && account.role !== "alumno") {
        skipped.push({ email, reason: "Esa cuenta no es de alumno." });
        continue;
      }
      if (account) {
        const enrolled = await this.prisma.enrollment.findUnique({
          where: { userId_classId: { userId: account.id, classId } },
        });
        if (enrolled) {
          skipped.push({ email, reason: "Ya está en la clase." });
          continue;
        }
      }
      // Reinvitar al mismo correo reemplaza la invitación anterior: nuevo token y caducidad.
      const invitation = await this.prisma.classInvitation.upsert({
        where: { classId_email: { classId, email } },
        create: { classId, email, token: newToken(), invitedById: user.userId, expiresAt: expiry() },
        update: {
          token: newToken(),
          invitedById: user.userId,
          expiresAt: expiry(),
          status: "pending",
          acceptedAt: null,
          emailSentAt: null,
        },
      });
      created.push({ invitation, accountId: account?.id ?? null });
    }

    const invitations = await Promise.all(
      created.map((c) => this.deliver(cls, c.invitation, c.accountId)),
    );
    return { invitations, skipped };
  }

  /**
   * Reparte una invitación: correo con el enlace y, si el invitado ya usa Atria,
   * aviso en la aplicación. Anota la fecha del envío cuando el correo sale.
   */
  private async deliver(
    cls: ClassWithOwner,
    invitation: ClassInvitation,
    accountId: string | null,
  ): Promise<ClassInvitationDto> {
    if (accountId) await this.notifyInvited(accountId, cls, invitation.token);
    const { subject, html, text } = invitationEmail({
      className: cls.name,
      classSubject: cls.subject,
      teacherName: cls.owner.name,
      url: `${webOrigin()}${invitePath(invitation.token)}`,
      expiresAt: invitation.expiresAt,
      hasAccount: !!accountId,
    });
    const sent = await this.mail.send({ to: invitation.email, subject, html, text });
    const row = sent
      ? await this.prisma.classInvitation.update({
          where: { id: invitation.id },
          data: { emailSentAt: new Date() },
        })
      : invitation;
    return this.toDto(row, !!accountId);
  }

  /** GET /classes/:id/invitations — invitaciones aún sin aceptar (las aceptadas ya salen en el roster). */
  async list(user: AuthUser, classId: string): Promise<ClassInvitationDto[]> {
    await this.assertTeacher(user, classId);
    const rows = await this.prisma.classInvitation.findMany({
      where: { classId, status: "pending" },
      orderBy: { createdAt: "desc" },
    });
    if (rows.length === 0) return [];
    const accounts = await this.prisma.user.findMany({
      where: { email: { in: rows.map((r) => r.email) } },
      select: { email: true },
    });
    const withAccount = new Set(accounts.map((a) => a.email));
    return rows.map((r) => this.toDto(r, withAccount.has(r.email)));
  }

  /**
   * POST /classes/:id/invitations/:invitationId/resend — amplía la caducidad y
   * vuelve a enviar. Mantiene el token para que un enlace ya compartido siga sirviendo.
   */
  async resend(user: AuthUser, classId: string, invitationId: string): Promise<ClassInvitationDto> {
    const cls = await this.assertTeacher(user, classId);
    const current = await this.prisma.classInvitation.findFirst({ where: { id: invitationId, classId } });
    if (!current) throw new NotFoundException();
    if (current.status === "accepted") throw new BadRequestException("Esa invitación ya se ha aceptado.");

    const invitation = await this.prisma.classInvitation.update({
      where: { id: current.id },
      data: { expiresAt: expiry(), invitedById: user.userId },
    });
    const account = await this.prisma.user.findUnique({
      where: { email: invitation.email },
      select: { id: true },
    });
    return this.deliver(cls, invitation, account?.id ?? null);
  }

  /** DELETE /classes/:id/invitations/:invitationId — revoca: borra la fila e invalida el enlace. */
  async revoke(user: AuthUser, classId: string, invitationId: string): Promise<{ id: string }> {
    await this.assertTeacher(user, classId);
    const { count } = await this.prisma.classInvitation.deleteMany({
      where: { id: invitationId, classId },
    });
    if (count === 0) throw new NotFoundException();
    return { id: invitationId };
  }

  /** GET /invitations/:token — datos públicos para la pantalla de aceptación. */
  async preview(token: string): Promise<InvitationPreviewDto> {
    const inv = await this.prisma.classInvitation.findUnique({
      where: { token },
      include: { class: { include: { owner: { select: { name: true } } } } },
    });
    if (!inv) throw new NotFoundException("Esta invitación no existe o ya no es válida.");
    const account = await this.prisma.user.findUnique({
      where: { email: inv.email },
      select: { id: true },
    });
    return {
      status: statusOf(inv),
      email: inv.email,
      className: inv.class.name,
      classSubject: inv.class.subject,
      teacherName: inv.class.owner.name,
      needsAccount: !account,
      expiresAt: inv.expiresAt.toISOString(),
    };
  }

  /**
   * POST /invitations/:token/accept — matricula al invitado. Si todavía no tiene
   * cuenta, la crea con el correo invitado y devuelve sesión para entrar ya
   * identificado; si ya la tiene, exige estar en sesión con ese mismo correo.
   */
  async accept(
    token: string,
    input: AcceptInvitationInput,
    current?: AuthUser,
  ): Promise<{ result: AcceptInvitationResultDto; session: IssuedTokens | null }> {
    const inv = await this.prisma.classInvitation.findUnique({
      where: { token },
      include: { class: true },
    });
    if (!inv) throw new NotFoundException("Esta invitación no existe o ya no es válida.");
    if (inv.status === "accepted") throw new BadRequestException("Esta invitación ya se ha utilizado.");
    if (statusOf(inv) === "expired") {
      throw new BadRequestException("La invitación ha caducado. Pide al docente que te la reenvíe.");
    }

    const account = await this.prisma.user.findUnique({ where: { email: inv.email } });
    let student: User;
    let session: IssuedTokens | null = null;

    if (account) {
      if (!current || current.userId !== account.id) {
        throw new UnauthorizedException(`Inicia sesión con ${inv.email} para aceptar la invitación.`);
      }
      student = account;
    } else {
      const name = input.name?.trim();
      if (!name) throw new BadRequestException("Escribe tu nombre y apellidos.");
      if (!input.password) throw new BadRequestException("Elige una contraseña.");
      student = await this.prisma.user.create({
        data: {
          name,
          email: inv.email,
          passwordHash: await argon2.hash(input.password),
          role: "alumno",
        },
      });
      session = await this.auth.issueSession(student);
    }

    await this.prisma.$transaction([
      this.prisma.enrollment.upsert({
        where: { userId_classId: { userId: student.id, classId: inv.classId } },
        create: { userId: student.id, classId: inv.classId, roleInClass: "student" },
        update: {},
      }),
      this.prisma.classInvitation.update({
        where: { id: inv.id },
        data: { status: "accepted", acceptedAt: new Date() },
      }),
    ]);

    await this.notifications.create({
      userId: inv.class.ownerId,
      type: "invite",
      title: `${student.name} se ha unido a ${inv.class.name}`,
      body: `Ha aceptado la invitación enviada a ${inv.email}.`,
      link: `/clase/${inv.classId}?tab=alumnos`,
      entityId: inv.classId,
    });

    return {
      result: { classId: inv.classId, className: inv.class.name, user: toUserDto(student) },
      session,
    };
  }

  private async notifyInvited(userId: string, cls: Class, token: string): Promise<void> {
    await this.notifications.create({
      userId,
      type: "invite",
      title: `Invitación a ${cls.name}`,
      body: "Ábrela para unirte a la clase.",
      link: invitePath(token),
      entityId: cls.id,
    });
  }

  private async assertTeacher(user: AuthUser, classId: string): Promise<ClassWithOwner> {
    const cls = await this.prisma.class.findUnique({
      where: { id: classId },
      include: { owner: { select: { name: true } } },
    });
    if (!cls) throw new NotFoundException();
    if (user.role !== "admin" && cls.ownerId !== user.userId) throw new ForbiddenException();
    return cls;
  }

  private toDto(inv: ClassInvitation, hasAccount: boolean): ClassInvitationDto {
    return {
      id: inv.id,
      email: inv.email,
      status: statusOf(inv),
      url: `${webOrigin()}${invitePath(inv.token)}`,
      hasAccount,
      emailSentAt: inv.emailSentAt?.toISOString() ?? null,
      expiresAt: inv.expiresAt.toISOString(),
      createdAt: inv.createdAt.toISOString(),
    };
  }
}
