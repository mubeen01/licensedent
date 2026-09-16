-- AlterEnum
ALTER TYPE "SubscriptionPlanType" ADD VALUE 'ireland_pathway';

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "standalonePackOnly" BOOLEAN NOT NULL DEFAULT false;
