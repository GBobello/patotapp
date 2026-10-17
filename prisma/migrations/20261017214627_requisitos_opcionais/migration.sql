-- CreateEnum
CREATE TYPE "DrawRuleKind" AS ENUM ('TOGETHER', 'APART');

-- AlterTable
ALTER TABLE "Patota" ADD COLUMN     "peerRatingEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "teamNames" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "DrawRule" (
    "id" TEXT NOT NULL,
    "patotaId" TEXT NOT NULL,
    "kind" "DrawRuleKind" NOT NULL,
    "firstId" TEXT NOT NULL,
    "secondId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DrawRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameTask" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "assigneeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeerRating" (
    "raterId" TEXT NOT NULL,
    "rateeId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeerRating_pkey" PRIMARY KEY ("raterId","rateeId")
);

-- CreateIndex
CREATE UNIQUE INDEX "DrawRule_patotaId_firstId_secondId_key" ON "DrawRule"("patotaId", "firstId", "secondId");

-- CreateIndex
CREATE INDEX "GameTask_gameId_idx" ON "GameTask"("gameId");

-- CreateIndex
CREATE INDEX "PeerRating_rateeId_idx" ON "PeerRating"("rateeId");

-- AddForeignKey
ALTER TABLE "DrawRule" ADD CONSTRAINT "DrawRule_patotaId_fkey" FOREIGN KEY ("patotaId") REFERENCES "Patota"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawRule" ADD CONSTRAINT "DrawRule_firstId_fkey" FOREIGN KEY ("firstId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawRule" ADD CONSTRAINT "DrawRule_secondId_fkey" FOREIGN KEY ("secondId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameTask" ADD CONSTRAINT "GameTask_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameTask" ADD CONSTRAINT "GameTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeerRating" ADD CONSTRAINT "PeerRating_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeerRating" ADD CONSTRAINT "PeerRating_rateeId_fkey" FOREIGN KEY ("rateeId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
