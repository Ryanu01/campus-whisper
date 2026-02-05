/*
  Warnings:

  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "CategoryEnum" AS ENUM ('funny', 'rant', 'crush', 'beef', 'gossips', 'academics');

-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_post_id_fkey";

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "categories" "CategoryEnum"[];

-- DropTable
DROP TABLE "Category";
