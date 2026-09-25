-- CreateEnum
CREATE TYPE "EmailCampaignStatus" AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'canceled');

-- CreateTable
CREATE TABLE "EmailCampaign" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subject" TEXT NOT NULL,
    "preheader" TEXT NOT NULL,
    "heading" TEXT NOT NULL,
    "bodyMarkdown" TEXT NOT NULL,
    "status" "EmailCampaignStatus" NOT NULL DEFAULT 'draft',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "audienceExamId" TEXT,
    "audiencePlanType" "SubscriptionPlanType",
    "audienceAccess" TEXT,
    "audienceCountry" TEXT,
    "createdById" TEXT,

    CONSTRAINT "EmailCampaign_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_audienceExamId_fkey" FOREIGN KEY ("audienceExamId") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
