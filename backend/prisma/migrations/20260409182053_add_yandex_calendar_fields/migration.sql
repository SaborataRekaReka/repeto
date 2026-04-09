-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "yandex_calendar_event_uid" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "yandex_calendar_email" TEXT,
ADD COLUMN     "yandex_calendar_login" TEXT,
ADD COLUMN     "yandex_calendar_token" JSONB;
