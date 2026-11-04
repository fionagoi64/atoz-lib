-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "deleteReason" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3);
