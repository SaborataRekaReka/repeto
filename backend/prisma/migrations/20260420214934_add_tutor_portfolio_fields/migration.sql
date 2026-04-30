-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "education" JSONB,
ADD COLUMN IF NOT EXISTS "experience" JSONB,
ADD COLUMN IF NOT EXISTS "qualification_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "qualification_label" TEXT,
ADD COLUMN IF NOT EXISTS "certificates" JSONB;
