/*
  Warnings:

  - You are about to drop the column `deleteReason` on the `Book` table. All the data in the column will be lost.

*/

-- CreateEnum
CREATE TYPE "BookStatus" AS ENUM (
  'ACTIVE',
  'ARCHIVED',
  'DELETED'
);

-- CreateEnum
CREATE TYPE "BookLifecycleAction" AS ENUM (
  'CREATED',
  'ARCHIVED',
  'UNARCHIVED',
  'DELETED',
  'RESTORED'
);

-- Add new lifecycle fields without dropping existing data
ALTER TABLE "Book"
ADD COLUMN "status" "BookStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "statusBeforeDelete" "BookStatus";

-- Create lifecycle audit table
CREATE TABLE "BookLifecycleLog" (
  "id" TEXT NOT NULL,
  "bookId" TEXT NOT NULL,
  "action" "BookLifecycleAction" NOT NULL,
  "previousStatus" "BookStatus",
  "newStatus" "BookStatus" NOT NULL,
  "reason" TEXT,
  "adminId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BookLifecycleLog_pkey" PRIMARY KEY ("id")
);

-- Create index
CREATE INDEX "BookLifecycleLog_bookId_createdAt_idx"
ON "BookLifecycleLog"("bookId", "createdAt");

-- Migrate existing deleted books
UPDATE "Book"
SET
  "status" = 'DELETED',
  "statusBeforeDelete" = 'ACTIVE'
WHERE "deletedAt" IS NOT NULL;

-- Create CREATED baseline logs for existing books
INSERT INTO "BookLifecycleLog" (
  "id",
  "bookId",
  "action",
  "previousStatus",
  "newStatus",
  "createdAt"
)
SELECT
  gen_random_uuid()::text,
  "id",
  'CREATED',
  NULL,
  'ACTIVE',
  "createdAt"
FROM "Book";

-- Preserve existing deletion history and reasons
INSERT INTO "BookLifecycleLog" (
  "id",
  "bookId",
  "action",
  "previousStatus",
  "newStatus",
  "reason",
  "createdAt"
)
SELECT
  gen_random_uuid()::text,
  "id",
  'DELETED',
  'ACTIVE',
  'DELETED',
  "deleteReason",
  "deletedAt"
FROM "Book"
WHERE "deletedAt" IS NOT NULL;

-- Drop old field only after preserving its data
ALTER TABLE "Book"
DROP COLUMN "deleteReason";

-- Add foreign key
ALTER TABLE "BookLifecycleLog"
ADD CONSTRAINT "BookLifecycleLog_bookId_fkey"
FOREIGN KEY ("bookId")
REFERENCES "Book"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
