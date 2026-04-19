ALTER TABLE "users"
ADD COLUMN "homework_default_cloud" "CloudProvider" NOT NULL DEFAULT 'YANDEX_DISK';

CREATE TABLE "homework_materials" (
    "id" TEXT NOT NULL,
    "homework_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "homework_materials_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "homework_materials_homework_id_file_id_key" ON "homework_materials"("homework_id", "file_id");
CREATE INDEX "homework_materials_file_id_idx" ON "homework_materials"("file_id");

ALTER TABLE "homework_materials"
ADD CONSTRAINT "homework_materials_homework_id_fkey" FOREIGN KEY ("homework_id") REFERENCES "homework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "homework_materials"
ADD CONSTRAINT "homework_materials_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
