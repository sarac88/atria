-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('pending', 'accepted');

-- CreateTable
CREATE TABLE "ClassInvitation" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'pending',
    "invitedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClassInvitation_token_key" ON "ClassInvitation"("token");

-- CreateIndex
CREATE INDEX "ClassInvitation_email_idx" ON "ClassInvitation"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ClassInvitation_classId_email_key" ON "ClassInvitation"("classId", "email");

-- AddForeignKey
ALTER TABLE "ClassInvitation" ADD CONSTRAINT "ClassInvitation_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassInvitation" ADD CONSTRAINT "ClassInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
