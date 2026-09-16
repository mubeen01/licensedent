-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "suggestedAt" TIMESTAMP(3),
ADD COLUMN     "suggestedCorrectKey" TEXT,
ADD COLUMN     "suggestedExplanation" TEXT,
ADD COLUMN     "suggestionSource" TEXT;
