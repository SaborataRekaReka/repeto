-- AlterTable
ALTER TABLE "users" ADD COLUMN     "format" TEXT,
ADD COLUMN     "offline_address" TEXT,
ADD COLUMN     "subject_details" JSONB,
ADD COLUMN     "tagline" TEXT,
ADD COLUMN     "vk" TEXT,
ADD COLUMN     "website" TEXT;
