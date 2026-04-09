-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "tutor_availability" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tutor_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_overrides" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "availability_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "start_time" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "client_name" TEXT NOT NULL,
    "client_phone" TEXT NOT NULL,
    "client_email" TEXT,
    "comment" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tutor_availability_user_id_day_of_week_idx" ON "tutor_availability"("user_id", "day_of_week");

-- CreateIndex
CREATE UNIQUE INDEX "tutor_availability_user_id_day_of_week_start_time_key" ON "tutor_availability"("user_id", "day_of_week", "start_time");

-- CreateIndex
CREATE INDEX "availability_overrides_user_id_date_idx" ON "availability_overrides"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "availability_overrides_user_id_date_start_time_key" ON "availability_overrides"("user_id", "date", "start_time");

-- CreateIndex
CREATE INDEX "booking_requests_user_id_status_idx" ON "booking_requests"("user_id", "status");

-- CreateIndex
CREATE INDEX "booking_requests_user_id_date_idx" ON "booking_requests"("user_id", "date");

-- AddForeignKey
ALTER TABLE "tutor_availability" ADD CONSTRAINT "tutor_availability_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_overrides" ADD CONSTRAINT "availability_overrides_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
