-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationChannel" ADD VALUE 'TELEGRAM';
ALTER TYPE "NotificationChannel" ADD VALUE 'MAX';

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "max_chat_id" TEXT,
ADD COLUMN     "telegram_chat_id" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "max_bot_token" TEXT,
ADD COLUMN     "telegram_bot_token" TEXT;
