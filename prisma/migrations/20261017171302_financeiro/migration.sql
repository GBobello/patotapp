-- CreateEnum
CREATE TYPE "BillingMode" AS ENUM ('FIXED_MONTHLY', 'SPLIT_PER_GAME');

-- CreateEnum
CREATE TYPE "ChargeStatus" AS ENUM ('PENDING', 'REPORTED', 'PAID', 'WAIVED');

-- AlterTable
ALTER TABLE "Patota" ADD COLUMN     "billingMode" "BillingMode" NOT NULL DEFAULT 'FIXED_MONTHLY',
ADD COLUMN     "dropInFeeCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "gameCostCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "keeperExempt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "monthlyCostCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "monthlyFeeCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pixKey" TEXT;

-- CreateTable
CREATE TABLE "Charge" (
    "id" TEXT NOT NULL,
    "patotaId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "competence" TEXT,
    "gameId" TEXT,
    "status" "ChargeStatus" NOT NULL DEFAULT 'PENDING',
    "reportedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Charge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "patotaId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Charge_patotaId_status_idx" ON "Charge"("patotaId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Charge_membershipId_competence_key" ON "Charge"("membershipId", "competence");

-- CreateIndex
CREATE UNIQUE INDEX "Charge_membershipId_gameId_key" ON "Charge"("membershipId", "gameId");

-- CreateIndex
CREATE INDEX "Expense_patotaId_date_idx" ON "Expense"("patotaId", "date");

-- AddForeignKey
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_patotaId_fkey" FOREIGN KEY ("patotaId") REFERENCES "Patota"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_patotaId_fkey" FOREIGN KEY ("patotaId") REFERENCES "Patota"("id") ON DELETE CASCADE ON UPDATE CASCADE;
