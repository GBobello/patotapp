-- CreateEnum
CREATE TYPE "Audience" AS ENUM ('ALL', 'MANAGERS');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notificationsSeenAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "patotaId" TEXT NOT NULL,
    "authorId" TEXT,
    "text" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementReaction" (
    "announcementId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,

    CONSTRAINT "AnnouncementReaction_pkey" PRIMARY KEY ("announcementId","membershipId","emoji")
);

-- CreateTable
CREATE TABLE "GameComment" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "authorId" TEXT,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "patotaId" TEXT NOT NULL,
    "actorId" TEXT,
    "message" TEXT NOT NULL,
    "href" TEXT,
    "audience" "Audience" NOT NULL DEFAULT 'ALL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Announcement_patotaId_createdAt_idx" ON "Announcement"("patotaId", "createdAt");

-- CreateIndex
CREATE INDEX "GameComment_gameId_createdAt_idx" ON "GameComment"("gameId", "createdAt");

-- CreateIndex
CREATE INDEX "Activity_patotaId_createdAt_idx" ON "Activity"("patotaId", "createdAt");

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_patotaId_fkey" FOREIGN KEY ("patotaId") REFERENCES "Patota"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementReaction" ADD CONSTRAINT "AnnouncementReaction_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementReaction" ADD CONSTRAINT "AnnouncementReaction_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameComment" ADD CONSTRAINT "GameComment_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameComment" ADD CONSTRAINT "GameComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_patotaId_fkey" FOREIGN KEY ("patotaId") REFERENCES "Patota"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;
