-- CreateEnum
CREATE TYPE "LessonPartQuizAttemptStatus" AS ENUM ('in_progress', 'submitted');

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "passThresholdPercent" INTEGER NOT NULL DEFAULT 70,
    "examId" TEXT NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonPart" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "youtubeId" TEXT,
    "durationMinutes" INTEGER,
    "notesMarkdown" TEXT,
    "lessonId" TEXT NOT NULL,

    CONSTRAINT "LessonPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonPartQuizAttempt" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "status" "LessonPartQuizAttemptStatus" NOT NULL DEFAULT 'in_progress',
    "correctCount" INTEGER,
    "userId" TEXT NOT NULL,
    "lessonPartId" TEXT NOT NULL,

    CONSTRAINT "LessonPartQuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonPartQuizAttemptItem" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "selectedKey" TEXT,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "LessonPartQuizAttemptItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_LessonPartToQuestion" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_slug_key" ON "Lesson"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "LessonPart_lessonId_order_key" ON "LessonPart"("lessonId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "LessonPartQuizAttemptItem_attemptId_questionId_key" ON "LessonPartQuizAttemptItem"("attemptId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "_LessonPartToQuestion_AB_unique" ON "_LessonPartToQuestion"("A", "B");

-- CreateIndex
CREATE INDEX "_LessonPartToQuestion_B_index" ON "_LessonPartToQuestion"("B");

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPart" ADD CONSTRAINT "LessonPart_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPartQuizAttempt" ADD CONSTRAINT "LessonPartQuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPartQuizAttempt" ADD CONSTRAINT "LessonPartQuizAttempt_lessonPartId_fkey" FOREIGN KEY ("lessonPartId") REFERENCES "LessonPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPartQuizAttemptItem" ADD CONSTRAINT "LessonPartQuizAttemptItem_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "LessonPartQuizAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPartQuizAttemptItem" ADD CONSTRAINT "LessonPartQuizAttemptItem_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LessonPartToQuestion" ADD CONSTRAINT "_LessonPartToQuestion_A_fkey" FOREIGN KEY ("A") REFERENCES "LessonPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LessonPartToQuestion" ADD CONSTRAINT "_LessonPartToQuestion_B_fkey" FOREIGN KEY ("B") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
