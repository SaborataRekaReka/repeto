-- AlterTable
ALTER TABLE "users"
ADD COLUMN "yandex_disk_token" JSONB,
ADD COLUMN "yandex_disk_root_path" TEXT,
ADD COLUMN "yandex_disk_email" TEXT;
