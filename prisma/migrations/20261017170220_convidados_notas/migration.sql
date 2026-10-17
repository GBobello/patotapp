-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "diaristasOpenAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "guestName" TEXT,
ADD COLUMN     "guestPosition" "Position",
ADD COLUMN     "rating" INTEGER NOT NULL DEFAULT 3,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Patota" ADD COLUMN     "diaristaWindowHours" INTEGER;
