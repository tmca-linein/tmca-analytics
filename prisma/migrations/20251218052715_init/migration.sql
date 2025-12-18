-- CreateTable
CREATE TABLE "ANFEvent" (
    "id" TEXT NOT NULL,
    "assignedUserId" TEXT NOT NULL,
    "wrikeItemId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "authorUserId" TEXT NOT NULL,

    CONSTRAINT "ANFEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentEvent" (
    "id" TEXT NOT NULL,
    "wrikeItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ANFEvent_authorUserId_assignedUserId_state_eventDate_idx" ON "ANFEvent"("authorUserId", "assignedUserId", "state", "eventDate");

-- CreateIndex
CREATE INDEX "CommentEvent_userId_eventDate_idx" ON "CommentEvent"("userId", "eventDate");
