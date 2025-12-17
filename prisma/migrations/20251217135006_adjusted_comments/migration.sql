/*
  Warnings:

  - Added the required column `authorUserId` to the `ANFEvent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wordCount` to the `CommentEvent` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ANFEvent_assignedUserId_state_eventDate_idx";

-- AlterTable
ALTER TABLE "ANFEvent" ADD COLUMN     "authorUserId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "CommentEvent" ADD COLUMN     "wordCount" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "ANFEvent_authorUserId_assignedUserId_state_eventDate_idx" ON "ANFEvent"("authorUserId", "assignedUserId", "state", "eventDate");

-- CreateIndex
CREATE INDEX "CommentEvent_userId_eventDate_idx" ON "CommentEvent"("userId", "eventDate");
