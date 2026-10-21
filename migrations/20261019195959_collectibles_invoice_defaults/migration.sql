-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "status" SET DEFAULT 'draft',
ALTER COLUMN "paidAt" DROP DEFAULT;
