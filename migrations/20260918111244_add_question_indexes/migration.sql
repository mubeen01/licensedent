-- CreateIndex
CREATE INDEX "Question_subjectId_status_idx" ON "Question"("subjectId", "status");

-- CreateIndex
CREATE INDEX "Question_importBatchId_status_idx" ON "Question"("importBatchId", "status");

-- CreateIndex
CREATE INDEX "Question_status_difficulty_idx" ON "Question"("status", "difficulty");
