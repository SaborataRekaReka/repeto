ALTER TABLE "users"
ADD COLUMN "google_drive_token" JSONB,
ADD COLUMN "google_drive_root_path" TEXT,
ADD COLUMN "google_drive_email" TEXT;
