-- CreateEnum
CREATE TYPE "SubscriptionSource" AS ENUM ('payment', 'admin_grant');

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "source" "SubscriptionSource" NOT NULL DEFAULT 'payment';
