-- AlterTable
ALTER TABLE "ConditionObservation" ADD COLUMN     "publiclyVisible" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "GradeObservation" ADD COLUMN     "publiclyVisible" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ProvenanceEvent" ADD COLUMN     "publiclyVisible" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ValuationObservation" ADD COLUMN     "publiclyVisible" BOOLEAN NOT NULL DEFAULT false;
