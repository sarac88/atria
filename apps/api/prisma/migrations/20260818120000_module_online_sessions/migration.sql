-- CreateTable
CREATE TABLE "OnlineSession" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'other',
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnlineSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OnlineSession_moduleId_idx" ON "OnlineSession"("moduleId");

-- AddForeignKey
ALTER TABLE "OnlineSession" ADD CONSTRAINT "OnlineSession_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;
