/*
  Warnings:

  - You are about to drop the column `max_bot_token` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `telegram_bot_token` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "max_bot_token",
DROP COLUMN "telegram_bot_token";
