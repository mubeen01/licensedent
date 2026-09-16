-- CreateEnum
CREATE TYPE "QuestionDifficulty" AS ENUM ('easy', 'medium', 'hard');

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "difficulty" "QuestionDifficulty",
ADD COLUMN     "isCaseBased" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isHighYield" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "suggestedDifficulty" "QuestionDifficulty",
ADD COLUMN     "suggestedIsCaseBased" BOOLEAN,
ADD COLUMN     "suggestedIsHighYield" BOOLEAN;
