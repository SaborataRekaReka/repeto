-- ── Student Accounts (self-service portal) ──

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "StudentAccountStatus" AS ENUM ('INVITED', 'ACTIVE', 'PAUSED');
CREATE TYPE "StudentOtpPurpose" AS ENUM ('LOGIN', 'BOOKING');

CREATE TABLE "student_accounts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "status" "StudentAccountStatus" NOT NULL DEFAULT 'INVITED',
    "email_verified_at" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "student_accounts_email_key" ON "student_accounts"("email");

CREATE TABLE "student_otps" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "purpose" "StudentOtpPurpose" NOT NULL DEFAULT 'LOGIN',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_otps_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "student_otps_email_purpose_idx" ON "student_otps"("email", "purpose");
CREATE INDEX "student_otps_expires_at_idx" ON "student_otps"("expires_at");

CREATE TABLE "student_refresh_tokens" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "student_refresh_tokens_token_key" ON "student_refresh_tokens"("token");
CREATE INDEX "student_refresh_tokens_account_id_idx" ON "student_refresh_tokens"("account_id");

ALTER TABLE "student_refresh_tokens"
    ADD CONSTRAINT "student_refresh_tokens_account_id_fkey"
    FOREIGN KEY ("account_id") REFERENCES "student_accounts"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Students: add account_id, drop portal token columns ──

ALTER TABLE "students" ADD COLUMN "account_id" TEXT;
CREATE INDEX "students_account_id_idx" ON "students"("account_id");

ALTER TABLE "students"
    ADD CONSTRAINT "students_account_id_fkey"
    FOREIGN KEY ("account_id") REFERENCES "student_accounts"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: group existing students by lowercased email → StudentAccount
INSERT INTO "student_accounts" ("id", "email", "name", "status", "created_at", "updated_at")
SELECT
    gen_random_uuid()::text,
    LOWER(TRIM(email)),
    MIN(name),
    'INVITED'::"StudentAccountStatus",
    MIN(created_at),
    NOW()
FROM "students"
WHERE email IS NOT NULL AND TRIM(email) <> ''
GROUP BY LOWER(TRIM(email));

UPDATE "students" s
SET "account_id" = sa."id"
FROM "student_accounts" sa
WHERE s.email IS NOT NULL
  AND TRIM(s.email) <> ''
  AND sa.email = LOWER(TRIM(s.email));

-- Drop legacy portal token columns
DROP INDEX IF EXISTS "students_portal_token_key";
ALTER TABLE "students" DROP COLUMN IF EXISTS "portal_token";
ALTER TABLE "students" DROP COLUMN IF EXISTS "portal_token_created_at";
