// Modelos en orden de inserción (cada uno sólo apunta a los anteriores). El
// borrado va al revés.
export const MODEL_ORDER = [
  "user",
  "file",
  "class",
  "enrollment",
  "classInvitation",
  "module",
  "onlineSession",
  "resource",
  "activity",
  "debatePost",
  "submission",
  "grade",
  "conversation",
  "conversationParticipant",
  "message",
  "messageReaction",
  "notification",
] as const;
