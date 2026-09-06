-- Vaciar y eliminar chats son acciones de cada participante, no del hilo: se
-- marcan aquí para que el otro conserve su copia.
ALTER TABLE "ConversationParticipant" ADD COLUMN "clearedAt" TIMESTAMP(3);
ALTER TABLE "ConversationParticipant" ADD COLUMN "hiddenAt" TIMESTAMP(3);
