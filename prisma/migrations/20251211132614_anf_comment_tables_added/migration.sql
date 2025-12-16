/*
  Warnings:

  - You are about to drop the column `assingedUser` on the `ANFEvent` table. All the data in the column will be lost.
  - You are about to drop the column `wrikeItem` on the `ANFEvent` table. All the data in the column will be lost.
  - You are about to drop the column `user` on the `CommentEvent` table. All the data in the column will be lost.
  - You are about to drop the column `wrikeItem` on the `CommentEvent` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ANFEvent" DROP COLUMN "assingedUser",
DROP COLUMN "wrikeItem";

-- AlterTable
ALTER TABLE "CommentEvent" DROP COLUMN "user",
DROP COLUMN "wrikeItem";
