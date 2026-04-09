-- AlterEnum
ALTER TYPE "LessonStatus" ADD VALUE 'RESCHEDULE_PENDING';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'RESCHEDULE_REQUESTED';

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "reschedule_new_time" TIMESTAMP(3);
