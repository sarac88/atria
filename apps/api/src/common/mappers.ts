import type { Class, ClassStatus, User } from "@prisma/client";
import type { ClassInfo, Role, StatusTuple, UserDto } from "@atria/types";

export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
    avatarUrl: user.avatarUrl ?? null,
  };
}

const STATUS: Record<ClassStatus, StatusTuple> = {
  live: ["En vivo", "info"],
  scheduled: ["Programado", "draft"],
  draft: ["Borrador", "default"],
};

export function toClassInfo(c: Class): ClassInfo {
  return {
    id: c.id,
    name: c.name,
    code: c.code,
    room: c.room,
    students: c.studentsCount,
    color: c.color,
    icon: c.icon,
    status: STATUS[c.status],
    progress: c.progress,
    openActivities: c.openActivities,
    pending: c.pending,
    nextSession: c.nextSession,
    desc: c.desc,
  };
}
