-- AlterEnum
ALTER TYPE "QuestionStatus" ADD VALUE 'rejected';

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedById" TEXT,
ADD COLUMN     "rejectionReason" TEXT;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
