-- CreateTable
CREATE TABLE "ANFEvent" (
    "id" TEXT NOT NULL,
    "assingedUser" TEXT NOT NULL,
    "assignedUserId" TEXT NOT NULL,
    "wrikeItem" TEXT NOT NULL,
    "wrikeItemId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ANFEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentEvent" (
    "id" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wrikeItem" TEXT NOT NULL,
    "wrikeItemId" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ANFEvent_assignedUserId_state_eventDate_idx" ON "ANFEvent"("assignedUserId", "state", "eventDate");
