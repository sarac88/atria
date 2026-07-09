-- AlterTable
ALTER TABLE "Activity" ADD COLUMN "moduleId" TEXT,
ADD COLUMN "allowLate" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "config" JSONB NOT NULL DEFAULT '{}';

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE SET NULL ON UPDATE CASCADE;
