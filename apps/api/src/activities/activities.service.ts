import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type {
  Activity,
  CreateDebatePostInput,
  DebateConfig,
  DebatePostDto,
  DebateThreadDto,
  SubmissionDto,
  SubmitInput,
  UpdateActivityInput,
} from "@atria/types";
import { Prisma } from "@prisma/client";
import type { AuthUser } from "../auth/decorators";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { toActivityDto, toDebatePostDto, toSubmissionDto } from "../common/mappers";

const SUBMISSION_INCLUDE = {
  student: { select: { id: true, name: true } },
  activity: { select: { id: true, title: true } },
  grade: true,
  file: true,
} as const;

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private async activityOrThrow(activityId: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: { class: { select: { id: true, ownerId: true } } },
    });
    if (!activity) throw new NotFoundException();
    return activity;
  }

  /** GET /activities/:id/submissions — una fila por alumno matriculado (docente/admin). */
  async listSubmissions(user: AuthUser, activityId: string): Promise<SubmissionDto[]> {
    const activity = await this.activityOrThrow(activityId);
    if (user.role !== "admin" && activity.class.ownerId !== user.userId) throw new ForbiddenException();

    const [roster, subs] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { classId: activity.classId, roleInClass: "student" },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.submission.findMany({ where: { activityId }, include: SUBMISSION_INCLUDE }),
    ]);

    const byStudent = new Map(subs.map((s) => [s.studentId, s]));
    return roster.map((e) => {
      const s = byStudent.get(e.user.id);
      if (s) return toSubmissionDto(s);
      return {
        id: `pending-${e.user.id}`,
        studentId: e.user.id,
        student: e.user.name,
        activityId,
        activity: activity.title,
        status: "Pendiente" as const,
        date: "—",
        grade: "—",
        feedback: "",
        late: false,
      };
    });
  }

  /** POST /activities/:id/submissions — el alumno matriculado entrega (solo metadatos). */
  async submit(user: AuthUser, activityId: string, input: SubmitInput): Promise<SubmissionDto> {
    const activity = await this.assertStudentEnrolled(user, activityId);
    // Los cuestionarios se entregan solo con respuestas, sin fichero asociado.
    const fileName = input.fileName ?? (input.answers ? null : "entrega.pdf");
    return this.persistSubmission(activity, user, { fileName, fileId: null, comment: input.comment, answers: input.answers });
  }

  /** POST /activities/:id/submissions/upload — el alumno entrega subiendo un fichero real. */
  async submitUpload(user: AuthUser, activityId: string, file: Express.Multer.File, comment?: string): Promise<SubmissionDto> {
    const activity = await this.assertStudentEnrolled(user, activityId);
    const saved = await this.prisma.file.create({
      data: { ownerId: user.userId, key: file.filename, name: file.originalname, size: file.size, mime: file.mimetype },
    });
    return this.persistSubmission(activity, user, { fileName: file.originalname, fileId: saved.id, comment });
  }

  /** Verifica que el usuario es un alumno matriculado en la clase de la actividad. */
  private async assertStudentEnrolled(user: AuthUser, activityId: string) {
    if (user.role !== "alumno") throw new ForbiddenException("Solo los alumnos pueden entregar.");
    const activity = await this.activityOrThrow(activityId);
    const enrolled = await this.prisma.enrollment.findUnique({
      where: { userId_classId: { userId: user.userId, classId: activity.classId } },
    });
    if (!enrolled) throw new ForbiddenException();
    return activity;
  }

  private async persistSubmission(
    activity: Awaited<ReturnType<ActivitiesService["activityOrThrow"]>>,
    user: AuthUser,
    data: { fileName: string | null; fileId: string | null; comment?: string; answers?: Record<string, string> },
  ): Promise<SubmissionDto> {
    const comment = data.comment?.trim() || null;
    const fields = {
      status: "entregado" as const,
      submittedAt: new Date(),
      fileName: data.fileName,
      fileId: data.fileId,
      comment,
      answers: data.answers ?? Prisma.JsonNull,
    };
    const sub = await this.prisma.submission.upsert({
      where: { activityId_studentId: { activityId: activity.id, studentId: user.userId } },
      update: fields,
      create: { activityId: activity.id, studentId: user.userId, ...fields },
      include: SUBMISSION_INCLUDE,
    });

    // Avisar al docente dueño de la clase.
    void this.notifications
      .create({
        userId: activity.class.ownerId,
        type: "submission",
        title: "Nueva entrega",
        body: `${sub.student.name} entregó «${activity.title}»`,
        link: `/clase/${activity.classId}`,
        entityId: sub.id,
      })
      .catch(() => undefined);

    return toSubmissionDto(sub);
  }

  private assertOwner(user: AuthUser, ownerId: string) {
    if (user.role !== "admin" && ownerId !== user.userId) throw new ForbiddenException();
  }

  /** El docente dueño, un admin o un alumno matriculado en la clase de la actividad. */
  private async assertClassMember(user: AuthUser, activity: { classId: string; class: { ownerId: string } }) {
    if (user.role === "admin" || activity.class.ownerId === user.userId) return;
    const enrolled = await this.prisma.enrollment.findUnique({
      where: { userId_classId: { userId: user.userId, classId: activity.classId } },
    });
    if (!enrolled) throw new ForbiddenException();
  }

  private debateConfig(config: unknown): DebateConfig {
    const c = config && typeof config === "object" && !Array.isArray(config) ? (config as { debate?: DebateConfig }) : {};
    return c.debate ?? {};
  }

  /** GET /activities/:id/debate — hilo del debate visible para quien lo pide. */
  async debateThread(user: AuthUser, activityId: string): Promise<DebateThreadDto> {
    const activity = await this.activityOrThrow(activityId);
    await this.assertClassMember(user, activity);
    const debate = this.debateConfig(activity.config);

    const posts = await this.prisma.debatePost.findMany({
      where: { activityId },
      include: { author: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: "asc" },
    });

    const mine = posts.filter((p) => p.authorId === user.userId);
    const myPosts = mine.filter((p) => !p.parentId).length;
    const myReplies = mine.filter((p) => p.parentId).length;

    // «Publicar antes de ver» solo aplica al alumnado, y solo hasta su primera intervención.
    const isStudent = user.role === "alumno";
    const canSeeOthers = !isStudent || !debate.postBeforeSeeing || myPosts > 0;
    const visible = canSeeOthers ? posts : mine;

    const roots = visible.filter((p) => !p.parentId);
    const byParent = new Map<string, typeof visible>();
    for (const p of visible) {
      if (!p.parentId) continue;
      byParent.set(p.parentId, [...(byParent.get(p.parentId) ?? []), p]);
    }

    return {
      openingQuestion: debate.openingQuestion ?? "",
      minReplies: debate.minReplies ?? 0,
      minWords: debate.minWords ?? 0,
      canSeeOthers,
      myPosts,
      myReplies,
      posts: roots.map((p) =>
        toDebatePostDto(
          p,
          user.userId,
          (byParent.get(p.id) ?? []).map((r) => toDebatePostDto(r, user.userId)),
        ),
      ),
    };
  }

  /** POST /activities/:id/debate — publica una intervención o una respuesta. */
  async createDebatePost(user: AuthUser, activityId: string, input: CreateDebatePostInput): Promise<DebatePostDto> {
    const activity = await this.activityOrThrow(activityId);
    await this.assertClassMember(user, activity);
    if (activity.type !== "debate") throw new BadRequestException("La actividad no es un debate.");

    const body = input.body.trim();
    if (!body) throw new BadRequestException("La intervención no puede estar vacía.");

    // El mínimo de palabras solo aplica a la intervención inicial, no a las respuestas.
    const minWords = this.debateConfig(activity.config).minWords ?? 0;
    if (user.role === "alumno" && !input.parentId && minWords > 0 && body.split(/\s+/).length < minWords) {
      throw new BadRequestException(`Tu intervención debe tener al menos ${minWords} palabras.`);
    }

    let parent = null;
    if (input.parentId) {
      parent = await this.prisma.debatePost.findUnique({ where: { id: input.parentId } });
      if (!parent || parent.activityId !== activityId) throw new NotFoundException();
      // Un solo nivel de anidamiento: responder a una respuesta cuelga del post raíz.
      if (parent.parentId) parent = await this.prisma.debatePost.findUniqueOrThrow({ where: { id: parent.parentId } });
    }

    const post = await this.prisma.debatePost.create({
      data: { activityId, authorId: user.userId, parentId: parent?.id ?? null, body },
      include: { author: { select: { id: true, name: true, role: true } } },
    });

    // La primera intervención del alumno cuenta como entrega, para poder calificarla.
    if (user.role === "alumno" && !parent) await this.ensureDebateSubmission(activity, user.userId);

    const recipient = parent && parent.authorId !== user.userId ? parent.authorId : !parent && user.role === "alumno" ? activity.class.ownerId : null;
    if (recipient) {
      void this.notifications
        .create({
          userId: recipient,
          type: "submission",
          title: parent ? "Respuesta en el debate" : "Nueva intervención en el debate",
          body: `${post.author.name} ha participado en «${activity.title}»`,
          link: `/clase/${activity.classId}`,
          entityId: post.id,
        })
        .catch(() => undefined);
    }

    return toDebatePostDto(post, user.userId);
  }

  /** DELETE /activities/debate/posts/:postId — el autor o el docente dueño pueden borrar. */
  async removeDebatePost(user: AuthUser, postId: string): Promise<{ id: string }> {
    const post = await this.prisma.debatePost.findUnique({
      where: { id: postId },
      include: { activity: { include: { class: { select: { ownerId: true } } } } },
    });
    if (!post) throw new NotFoundException();
    const isAuthor = post.authorId === user.userId;
    if (!isAuthor && user.role !== "admin" && post.activity.class.ownerId !== user.userId) throw new ForbiddenException();
    await this.prisma.debatePost.delete({ where: { id: postId } });
    return { id: postId };
  }

  /** Crea (si no existía) la entrega que representa la participación del alumno en el debate. */
  private async ensureDebateSubmission(activity: { id: string; classId: string }, studentId: string) {
    const existing = await this.prisma.submission.findUnique({
      where: { activityId_studentId: { activityId: activity.id, studentId } },
    });
    if (existing) return;
    await this.prisma.submission.create({
      data: { activityId: activity.id, studentId, status: "entregado", submittedAt: new Date() },
    });
  }

  /** PATCH /activities/:id — edita una actividad (docente dueño o admin). */
  async update(user: AuthUser, activityId: string, input: UpdateActivityInput): Promise<Activity> {
    const existing = await this.activityOrThrow(activityId);
    this.assertOwner(user, existing.class.ownerId);

    const data: Prisma.ActivityUpdateInput = {};

    if (input.type !== undefined) data.type = input.type;
    if (input.title !== undefined) data.title = input.title;
    if (input.instructions !== undefined) data.instructions = input.instructions;
    if (input.dueAt !== undefined) data.dueAt = input.dueAt;
    if (input.format !== undefined) data.format = input.format;
    if (input.status !== undefined) data.status = input.status;
    if (input.allowLate !== undefined) data.allowLate = input.allowLate;
    if (input.moduleId !== undefined) {
      data.module = input.moduleId
        ? { connect: { id: input.moduleId } }
        : { disconnect: true };
    }

    if (input.questions !== undefined || input.quiz !== undefined || input.debate !== undefined) {
      const config: Prisma.InputJsonValue = {};
      if (input.questions?.length) (config as Record<string, unknown>).questions = input.questions;
      if (input.quiz) (config as Record<string, unknown>).quiz = input.quiz;
      if (input.debate) (config as Record<string, unknown>).debate = input.debate;
      data.config = config;
    }

    const type = input.type ?? existing.type;
    if (input.points !== undefined) {
      data.points = input.points;
    } else if (type === "cuestionario" && input.questions?.length) {
      data.points = input.questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);
    }

    const activity = await this.prisma.activity.update({ where: { id: activityId }, data });
    const [total, submitted] = await Promise.all([
      this.prisma.enrollment.count({ where: { classId: activity.classId, roleInClass: "student" } }),
      this.prisma.submission.count({ where: { activityId } }),
    ]);
    return toActivityDto(activity, submitted, total);
  }

  /** DELETE /activities/:id — elimina una actividad (docente dueño o admin). */
  async remove(user: AuthUser, activityId: string): Promise<{ id: string }> {
    const activity = await this.activityOrThrow(activityId);
    this.assertOwner(user, activity.class.ownerId);
    await this.prisma.activity.delete({ where: { id: activityId } });
    return { id: activityId };
  }
}
