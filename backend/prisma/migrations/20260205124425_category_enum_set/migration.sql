-- AlterTable
ALTER TABLE "Post" ALTER COLUMN "categories" SET NOT NULL,
ALTER COLUMN "categories" SET DATA TYPE "CategoryEnum";
