ALTER TYPE "TaxStatus" ADD VALUE IF NOT EXISTS 'LEGAL_ENTITY';

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "tax_inn" TEXT,
  ADD COLUMN IF NOT EXISTS "tax_display_name" TEXT;

ALTER TABLE "registration_verifications"
  ADD COLUMN IF NOT EXISTS "legal_version" TEXT,
  ADD COLUMN IF NOT EXISTS "legal_document_hash" TEXT,
  ADD COLUMN IF NOT EXISTS "legal_consents" JSONB;

CREATE TABLE IF NOT EXISTS "legal_versions" (
  "id" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "published_at" TIMESTAMP(3) NOT NULL,
  "url" TEXT NOT NULL,
  "hash" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "legal_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "legal_versions_version_key" ON "legal_versions"("version");
CREATE INDEX IF NOT EXISTS "legal_versions_active_published_at_idx" ON "legal_versions"("active", "published_at");

CREATE TABLE IF NOT EXISTS "legal_consents" (
  "id" TEXT NOT NULL,
  "legal_version_id" TEXT NOT NULL,
  "user_id" TEXT,
  "tutor_id" TEXT,
  "consent_type" TEXT NOT NULL,
  "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "document_url" TEXT NOT NULL,
  "document_anchor" TEXT,
  "document_version" TEXT NOT NULL,
  "document_hash" TEXT,
  "checkbox_text" TEXT NOT NULL,
  "granted" BOOLEAN NOT NULL DEFAULT false,
  "source" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "legal_consents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "legal_consents_user_id_occurred_at_idx" ON "legal_consents"("user_id", "occurred_at");
CREATE INDEX IF NOT EXISTS "legal_consents_tutor_id_occurred_at_idx" ON "legal_consents"("tutor_id", "occurred_at");
CREATE INDEX IF NOT EXISTS "legal_consents_consent_type_occurred_at_idx" ON "legal_consents"("consent_type", "occurred_at");
CREATE INDEX IF NOT EXISTS "legal_consents_source_occurred_at_idx" ON "legal_consents"("source", "occurred_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'legal_consents_legal_version_id_fkey'
  ) THEN
    ALTER TABLE "legal_consents"
      ADD CONSTRAINT "legal_consents_legal_version_id_fkey"
      FOREIGN KEY ("legal_version_id") REFERENCES "legal_versions"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
