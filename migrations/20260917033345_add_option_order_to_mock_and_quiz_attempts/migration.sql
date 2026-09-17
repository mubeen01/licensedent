-- AlterTable
ALTER TABLE "CustomQuizAttemptItem" ADD COLUMN     "optionOrder" JSONB;

-- AlterTable
ALTER TABLE "MockExamAttemptItem" ADD COLUMN     "optionOrder" JSONB;
