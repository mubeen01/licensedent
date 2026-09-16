-- CreateEnum
CREATE TYPE "MockExamAttemptStatus" AS ENUM ('in_progress', 'submitted');

-- AlterTable
ALTER TABLE "MockTest" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "questionCount" INTEGER NOT NULL DEFAULT 150;

-- CreateTable
CREATE TABLE "MockExamAttempt" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "status" "MockExamAttemptStatus" NOT NULL DEFAULT 'in_progress',
    "durationMinutes" INTEGER NOT NULL,
    "correctCount" INTEGER,
    "userId" TEXT NOT NULL,
    "mockTestId" TEXT NOT NULL,

    CONSTRAINT "MockExamAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockExamAttemptItem" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "selectedKey" TEXT,
    "markedForReview" BOOLEAN NOT NULL DEFAULT false,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "MockExamAttemptItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MockExamAttemptItem_attemptId_questionId_key" ON "MockExamAttemptItem"("attemptId", "questionId");

-- AddForeignKey
ALTER TABLE "MockExamAttempt" ADD CONSTRAINT "MockExamAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockExamAttempt" ADD CONSTRAINT "MockExamAttempt_mockTestId_fkey" FOREIGN KEY ("mockTestId") REFERENCES "MockTest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockExamAttemptItem" ADD CONSTRAINT "MockExamAttemptItem_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "MockExamAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockExamAttemptItem" ADD CONSTRAINT "MockExamAttemptItem_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
