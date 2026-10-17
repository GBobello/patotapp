-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'PENDING');

-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Patota" ADD COLUMN     "requireApproval" BOOLEAN NOT NULL DEFAULT false;
