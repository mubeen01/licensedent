-- CreateEnum
CREATE TYPE "CustomQuizAttemptStatus" AS ENUM ('in_progress', 'submitted');

-- CreateTable
CREATE TABLE "CustomQuizAttempt" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "status" "CustomQuizAttemptStatus" NOT NULL DEFAULT 'in_progress',
    "durationMinutes" INTEGER,
    "correctCount" INTEGER,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CustomQuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomQuizAttemptItem" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "selectedKey" TEXT,
    "markedForReview" BOOLEAN NOT NULL DEFAULT false,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "CustomQuizAttemptItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomQuizAttemptItem_attemptId_questionId_key" ON "CustomQuizAttemptItem"("attemptId", "questionId");

-- AddForeignKey
ALTER TABLE "CustomQuizAttempt" ADD CONSTRAINT "CustomQuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomQuizAttemptItem" ADD CONSTRAINT "CustomQuizAttemptItem_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "CustomQuizAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomQuizAttemptItem" ADD CONSTRAINT "CustomQuizAttemptItem_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
