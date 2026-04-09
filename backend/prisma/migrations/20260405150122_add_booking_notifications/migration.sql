-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'BOOKING_NEW';
ALTER TYPE "NotificationType" ADD VALUE 'BOOKING_CONFIRMED';
ALTER TYPE "NotificationType" ADD VALUE 'BOOKING_REJECTED';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "booking_request_id" TEXT;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_booking_request_id_fkey" FOREIGN KEY ("booking_request_id") REFERENCES "booking_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
