-- CreateTable
CREATE TABLE "DebatePost" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DebatePost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DebatePost_activityId_idx" ON "DebatePost"("activityId");

-- AddForeignKey
ALTER TABLE "DebatePost" ADD CONSTRAINT "DebatePost_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebatePost" ADD CONSTRAINT "DebatePost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebatePost" ADD CONSTRAINT "DebatePost_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "DebatePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
