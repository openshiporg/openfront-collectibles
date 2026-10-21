-- Nullable provider transaction identity supports pre-existing capture rows,
-- while a PostgreSQL unique index still prevents duplicate non-null new keys.
ALTER TABLE "Capture" ADD COLUMN "providerCaptureKey" TEXT;

-- Reconcile one pre-existing row per provider transaction. Historical duplicate
-- financial rows remain untouched for explicit operator review; nullable keys
-- prevent this additive migration from rewriting or deleting that evidence.
WITH candidates AS (
  SELECT
    c."id",
    COALESCE(
      p."data"->>'paymentIntentId',
      p."data"->>'payment_intent_id',
      c."metadata"->>'paymentIntentId',
      p."data"->>'orderId',
      c."metadata"->>'resourceId'
    ) AS transaction_id,
    COALESCE(
      p."data"->>'paymentProviderId',
      c."metadata"->>'paymentProviderId',
      c."metadata"->>'providerId'
    ) AS provider_id,
    c."createdAt"
  FROM "Capture" AS c
  LEFT JOIN "Payment" AS p ON p."id" = c."payment"
  WHERE c."providerCaptureKey" IS NULL
), ranked AS (
  SELECT
    "id",
    transaction_id,
    provider_id,
    ROW_NUMBER() OVER (
      PARTITION BY provider_id, transaction_id
      ORDER BY "createdAt", "id"
    ) AS row_number
  FROM candidates
  WHERE provider_id IS NOT NULL AND provider_id <> ''
    AND transaction_id IS NOT NULL AND transaction_id <> ''
)
UPDATE "Capture" AS c
SET "providerCaptureKey" = 'v1:' || LENGTH(r.provider_id)::text || ':' || r.provider_id || ':' || r.transaction_id
FROM ranked AS r
WHERE c."id" = r."id" AND r.row_number = 1;

-- Nullable keys permit unrelated/manual captures while preventing duplicate
-- economic identities for all reconciled and future provider captures.
CREATE UNIQUE INDEX "Capture_providerCaptureKey_key" ON "Capture"("providerCaptureKey");
