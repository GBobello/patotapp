-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "attended" BOOLEAN,
ADD COLUMN     "goals" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "resultSavedAt" TIMESTAMP(3),
ADD COLUMN     "teamScores" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
