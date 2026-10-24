-- Data only: stores seeded before the rename still call the manual provider
-- "Manual review". Rename that exact default row; custom names are left alone.
UPDATE "PaymentProvider"
SET "name" = 'Bank transfer (manual review)'
WHERE "code" = 'pp_system_default' AND "name" = 'Manual review';
