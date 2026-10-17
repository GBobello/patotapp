-- AlterTable
ALTER TABLE "Patota" ADD COLUMN     "autoCreateGames" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "Game_patotaId_startsAt_key" ON "Game"("patotaId", "startsAt");

