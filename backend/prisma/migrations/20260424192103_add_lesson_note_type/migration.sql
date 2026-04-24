-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('TUTOR', 'PORTAL_REVIEW', 'LESSON_MATERIALS');

-- AlterTable: add column with default TUTOR
ALTER TABLE "lesson_notes" ADD COLUMN "note_type" "NoteType" NOT NULL DEFAULT 'TUTOR';

-- Backfill: set PORTAL_REVIEW for notes with PORTAL_REVIEW: prefix
UPDATE "lesson_notes"
SET "note_type" = 'PORTAL_REVIEW'
WHERE "content" LIKE 'PORTAL_REVIEW:%';

-- Backfill: set LESSON_MATERIALS for notes with LESSON_MATERIALS: prefix
UPDATE "lesson_notes"
SET "note_type" = 'LESSON_MATERIALS'
WHERE "content" LIKE 'LESSON_MATERIALS:%';

-- CreateIndex
CREATE INDEX "lesson_notes_student_id_note_type_idx" ON "lesson_notes"("student_id", "note_type");
