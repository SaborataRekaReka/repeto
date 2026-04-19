ALTER TABLE "users"
ADD COLUMN "show_public_packages" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "packages"
ADD COLUMN "is_public" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "packages"
ALTER COLUMN "student_id" DROP NOT NULL;

UPDATE "packages"
SET
  "is_public" = true,
  "comment" = NULLIF(
    TRIM(
      REGEXP_REPLACE(COALESCE("comment", ''), '^\[PUBLIC_PACKAGE\]\s*\n?', '')
    ),
    ''
  )
WHERE "comment" LIKE '[PUBLIC_PACKAGE]%';

UPDATE "packages"
SET "student_id" = NULL
WHERE "is_public" = true;

CREATE INDEX "packages_user_id_is_public_status_idx"
ON "packages"("user_id", "is_public", "status");

ALTER TABLE "booking_requests"
ADD COLUMN "package_id" TEXT;

CREATE INDEX "booking_requests_package_id_idx"
ON "booking_requests"("package_id");

ALTER TABLE "booking_requests"
ADD CONSTRAINT "booking_requests_package_id_fkey"
FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
