-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('SCHEDULED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('CONFIRMED', 'MAYBE', 'DECLINED', 'WAITLIST');

-- AlterTable
ALTER TABLE "Patota" ADD COLUMN     "defaultDeadlineHours" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "defaultMaxPlayers" INTEGER NOT NULL DEFAULT 14,
ADD COLUMN     "defaultTeamsCount" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "defaultTime" TEXT,
ADD COLUMN     "defaultWeekday" INTEGER;

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "patotaId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "maxPlayers" INTEGER NOT NULL,
    "teamsCount" INTEGER NOT NULL DEFAULT 2,
    "confirmationDeadline" TIMESTAMP(3) NOT NULL,
    "status" "GameStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Game_patotaId_startsAt_idx" ON "Game"("patotaId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_gameId_membershipId_key" ON "Attendance"("gameId", "membershipId");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_patotaId_fkey" FOREIGN KEY ("patotaId") REFERENCES "Patota"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
