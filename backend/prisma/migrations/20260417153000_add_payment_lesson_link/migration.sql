ALTER TABLE "payments"
ADD COLUMN "lesson_id" TEXT;

CREATE INDEX "payments_lesson_id_idx" ON "payments"("lesson_id");

ALTER TABLE "payments"
ADD CONSTRAINT "payments_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
