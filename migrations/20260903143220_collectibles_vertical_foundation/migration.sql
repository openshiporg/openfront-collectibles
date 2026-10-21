-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "canManageAuctions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageCatalog" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageCollectibleCustomers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageConsignments" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageEvidence" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageIntegrations" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageInventory" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageListings" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageRisk" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canReadCollectibles" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AttributeDefinition" (
    "id" TEXT NOT NULL,
    "store" TEXT,
    "category" TEXT,
    "name" TEXT NOT NULL DEFAULT '',
    "key" TEXT NOT NULL DEFAULT '',
    "valueType" TEXT DEFAULT 'text',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "filterable" BOOLEAN NOT NULL DEFAULT true,
    "public" BOOLEAN NOT NULL DEFAULT true,
    "options" JSONB DEFAULT '[]',
    "validationRules" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttributeDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogItem" (
    "id" TEXT NOT NULL,
    "store" TEXT,
    "category" TEXT,
    "franchise" TEXT,
    "collectibleSet" TEXT,
    "release" TEXT,
    "title" TEXT NOT NULL DEFAULT '',
    "handle" TEXT NOT NULL DEFAULT '',
    "catalogNumber" TEXT NOT NULL DEFAULT '',
    "maker" TEXT NOT NULL DEFAULT '',
    "year" INTEGER,
    "description" TEXT NOT NULL DEFAULT '',
    "attributeValues" JSONB DEFAULT '{}',
    "status" TEXT DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectibleCategory" (
    "id" TEXT NOT NULL,
    "store" TEXT,
    "name" TEXT NOT NULL DEFAULT '',
    "handle" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "parent" TEXT,
    "status" TEXT DEFAULT 'draft',
    "sortOrder" INTEGER DEFAULT 0,
    "publicMetadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectibleCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectibleMedia" (
    "id" TEXT NOT NULL,
    "store" TEXT,
    "catalogItem" TEXT,
    "specimen" TEXT,
    "kind" TEXT DEFAULT 'image',
    "url" TEXT NOT NULL DEFAULT '',
    "altText" TEXT NOT NULL DEFAULT '',
    "visibility" TEXT DEFAULT 'restricted',
    "source" TEXT NOT NULL DEFAULT '',
    "capturedAt" TIMESTAMP(3),
    "checksum" TEXT NOT NULL DEFAULT '',
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectibleMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectibleRelease" (
    "id" TEXT NOT NULL,
    "store" TEXT,
    "collectibleSet" TEXT,
    "name" TEXT NOT NULL DEFAULT '',
    "handle" TEXT NOT NULL DEFAULT '',
    "releaseDate" TIMESTAMP(3),
    "edition" TEXT NOT NULL DEFAULT '',
    "printRunReported" INTEGER,
    "printRunSource" TEXT NOT NULL DEFAULT '',
    "publicNotes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectibleRelease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectibleSet" (
    "id" TEXT NOT NULL,
    "store" TEXT,
    "franchise" TEXT,
    "category" TEXT,
    "name" TEXT NOT NULL DEFAULT '',
    "handle" TEXT NOT NULL DEFAULT '',
    "manufacturer" TEXT NOT NULL DEFAULT '',
    "startYear" INTEGER,
    "endYear" INTEGER,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectibleSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Franchise" (
    "id" TEXT NOT NULL,
    "store" TEXT,
    "name" TEXT NOT NULL DEFAULT '',
    "handle" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "externalReferences" JSONB DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Franchise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Specimen" (
    "id" TEXT NOT NULL,
    "store" TEXT,
    "catalogItem" TEXT,
    "displayName" TEXT NOT NULL DEFAULT '',
    "specimenCode" TEXT NOT NULL DEFAULT '',
    "lifecycleStatus" TEXT DEFAULT 'intake',
    "attributeValues" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Specimen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecimenIdentifier" (
    "id" TEXT NOT NULL,
    "specimen" TEXT,
    "type" TEXT DEFAULT 'operator',
    "issuer" TEXT NOT NULL DEFAULT '',
    "value" TEXT NOT NULL DEFAULT '',
    "observedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "evidence" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpecimenIdentifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConditionObservation" (
    "id" TEXT NOT NULL,
    "specimen" TEXT,
    "observer" TEXT,
    "sourceType" TEXT DEFAULT 'operator',
    "scale" TEXT NOT NULL DEFAULT '',
    "label" TEXT NOT NULL DEFAULT '',
    "score" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "observedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT DEFAULT 'reported',
    "mediaReferences" JSONB DEFAULT '[]',
    "evidence" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConditionObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustodyEvent" (
    "id" TEXT NOT NULL,
    "specimen" TEXT,
    "type" TEXT DEFAULT 'intake',
    "occurredAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "fromLocation" TEXT,
    "toLocation" TEXT,
    "actor" TEXT,
    "counterpartyReference" TEXT NOT NULL DEFAULT '',
    "evidence" JSONB DEFAULT '{}',
    "idempotencyKey" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustodyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeObservation" (
    "id" TEXT NOT NULL,
    "specimen" TEXT,
    "gradingCompany" TEXT,
    "reportedGrade" TEXT NOT NULL DEFAULT '',
    "reportedLabel" TEXT NOT NULL DEFAULT '',
    "certificateReference" TEXT NOT NULL DEFAULT '',
    "certificateLookupUrl" TEXT NOT NULL DEFAULT '',
    "observedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "verificationState" TEXT DEFAULT 'not_checked',
    "providerResponseHash" TEXT NOT NULL DEFAULT '',
    "providerResponse" JSONB,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "disclaimer" TEXT NOT NULL DEFAULT 'This records an attributed grading/certificate observation and does not establish authenticity.',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradeObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradingCompany" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "code" TEXT NOT NULL DEFAULT '',
    "website" TEXT NOT NULL DEFAULT '',
    "certificateLookupTemplate" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "disclaimer" TEXT NOT NULL DEFAULT 'Provider-reported grading evidence; not an Openfront authenticity determination.',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradingCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProvenanceEvent" (
    "id" TEXT NOT NULL,
    "specimen" TEXT,
    "eventType" TEXT DEFAULT 'other',
    "occurredAt" TIMESTAMP(3),
    "recordedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "summary" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT '',
    "confidence" TEXT DEFAULT 'unreviewed',
    "reviewState" TEXT DEFAULT 'reported',
    "publicEvidence" JSONB DEFAULT '[]',
    "restrictedParties" JSONB,
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProvenanceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValuationObservation" (
    "id" TEXT NOT NULL,
    "specimen" TEXT,
    "amountMinor" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT '',
    "sourceType" TEXT DEFAULT 'operator',
    "sourceName" TEXT NOT NULL DEFAULT '',
    "sourceReference" TEXT NOT NULL DEFAULT '',
    "observedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "confidence" TEXT DEFAULT 'unreviewed',
    "notes" TEXT NOT NULL DEFAULT '',
    "disclaimer" TEXT NOT NULL DEFAULT 'Attributed valuation evidence; not an appraisal or guarantee of sale value.',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValuationObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryLocation" (
    "id" TEXT NOT NULL,
    "store" TEXT,
    "name" TEXT NOT NULL DEFAULT '',
    "code" TEXT NOT NULL DEFAULT '',
    "type" TEXT DEFAULT 'shop',
    "publicLabel" TEXT NOT NULL DEFAULT '',
    "restrictedLocation" JSONB,
    "status" TEXT DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL,
    "inventoryUnit" TEXT,
    "type" TEXT DEFAULT 'adjust',
    "fromStatus" TEXT NOT NULL DEFAULT '',
    "toStatus" TEXT NOT NULL DEFAULT '',
    "fromLocation" TEXT,
    "toLocation" TEXT,
    "reason" TEXT NOT NULL DEFAULT '',
    "actor" TEXT,
    "occurredAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "evidence" JSONB DEFAULT '{}',
    "idempotencyKey" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryUnit" (
    "id" TEXT NOT NULL,
    "store" TEXT,
    "specimen" TEXT,
    "commerceVariant" TEXT,
    "sku" TEXT NOT NULL DEFAULT '',
    "ownershipBasis" TEXT DEFAULT 'owned',
    "status" TEXT DEFAULT 'intake',
    "location" TEXT,
    "quantity" INTEGER DEFAULT 1,
    "version" INTEGER DEFAULT 1,
    "acquiredAmountMinor" INTEGER,
    "currencyCode" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "inventoryUnit" TEXT,
    "listing" TEXT,
    "cart" TEXT,
    "offer" TEXT,
    "auction" TEXT,
    "purpose" TEXT DEFAULT 'cart',
    "status" TEXT DEFAULT 'active',
    "expiresAt" TIMESTAMP(3),
    "ownerUser" TEXT,
    "guestProofHash" TEXT NOT NULL DEFAULT '',
    "idempotencyKey" TEXT NOT NULL DEFAULT '',
    "releasedAt" TIMESTAMP(3),
    "releaseReason" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Auction" (
    "id" TEXT NOT NULL,
    "listing" TEXT,
    "status" TEXT DEFAULT 'draft',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "openingAmountMinor" INTEGER NOT NULL,
    "currentAmountMinor" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT '',
    "reserveAmountMinor" INTEGER,
    "reserveMet" BOOLEAN NOT NULL DEFAULT false,
    "minimumIncrementMinor" INTEGER NOT NULL DEFAULT 100,
    "extensionWindowSeconds" INTEGER DEFAULT 120,
    "extensionSeconds" INTEGER DEFAULT 120,
    "maximumExtensions" INTEGER DEFAULT 5,
    "extensionCount" INTEGER DEFAULT 0,
    "leadingBidder" TEXT,
    "bidCount" INTEGER DEFAULT 0,
    "reservation" TEXT,
    "settlementSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Auction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "auction" TEXT,
    "bidder" TEXT,
    "amountMinor" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT '',
    "status" TEXT DEFAULT 'accepted',
    "rejectionReason" TEXT NOT NULL DEFAULT '',
    "acceptedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "resultingEndAt" TIMESTAMP(3),
    "idempotencyKey" TEXT NOT NULL DEFAULT '',
    "requestMetadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "store" TEXT,
    "inventoryUnit" TEXT,
    "seller" TEXT,
    "title" TEXT NOT NULL DEFAULT '',
    "slug" TEXT NOT NULL DEFAULT '',
    "format" TEXT DEFAULT 'fixed_price',
    "status" TEXT DEFAULT 'draft',
    "priceMinor" INTEGER,
    "compareAtMinor" INTEGER,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "publishedAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "publicationSnapshot" JSONB DEFAULT '{}',
    "publicSummary" TEXT NOT NULL DEFAULT '',
    "offersEnabled" BOOLEAN NOT NULL DEFAULT true,
    "minimumOfferMinor" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "listing" TEXT,
    "buyer" TEXT,
    "seller" TEXT,
    "status" TEXT DEFAULT 'open',
    "currentAmountMinor" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT '',
    "expiresAt" TIMESTAMP(3),
    "currentRevision" INTEGER DEFAULT 1,
    "reservation" TEXT,
    "idempotencyKey" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferRevision" (
    "id" TEXT NOT NULL,
    "offer" TEXT,
    "sequence" INTEGER NOT NULL,
    "actorType" TEXT DEFAULT 'buyer',
    "actor" TEXT,
    "action" TEXT DEFAULT 'created',
    "amountMinor" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT '',
    "message" TEXT NOT NULL DEFAULT '',
    "occurredAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "idempotencyKey" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedSearch" (
    "id" TEXT NOT NULL,
    "user" TEXT,
    "name" TEXT NOT NULL DEFAULT '',
    "query" TEXT NOT NULL DEFAULT '',
    "filters" JSONB DEFAULT '{}',
    "notificationFrequency" TEXT DEFAULT 'none',
    "lastNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" TEXT NOT NULL,
    "user" TEXT,
    "catalogItem" TEXT,
    "listing" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Buylist" (
    "id" TEXT NOT NULL,
    "store" TEXT,
    "name" TEXT NOT NULL DEFAULT '',
    "status" TEXT DEFAULT 'draft',
    "currencyCode" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Buylist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuylistEntry" (
    "id" TEXT NOT NULL,
    "buylist" TEXT,
    "catalogItem" TEXT,
    "criteria" JSONB DEFAULT '{}',
    "offerAmountMinor" INTEGER NOT NULL,
    "maximumQuantity" INTEGER,
    "active" TEXT DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuylistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsignmentAgreement" (
    "id" TEXT NOT NULL,
    "intake" TEXT,
    "consignor" TEXT,
    "version" INTEGER NOT NULL,
    "status" TEXT DEFAULT 'draft',
    "commissionBasisPoints" INTEGER NOT NULL,
    "fixedFeeMinor" INTEGER DEFAULT 0,
    "currencyCode" TEXT NOT NULL DEFAULT '',
    "pricingAuthority" TEXT DEFAULT 'mutual',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "termsSnapshot" JSONB DEFAULT '{}',
    "acceptedAt" TIMESTAMP(3),
    "acceptanceEvidence" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsignmentAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsignmentIntake" (
    "id" TEXT NOT NULL,
    "store" TEXT,
    "consignor" TEXT,
    "reference" TEXT NOT NULL DEFAULT '',
    "status" TEXT DEFAULT 'submitted',
    "submittedDescription" TEXT NOT NULL DEFAULT '',
    "intakeObservations" JSONB DEFAULT '{}',
    "receivedAt" TIMESTAMP(3),
    "custodyEvidence" JSONB DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsignmentIntake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsignmentItem" (
    "id" TEXT NOT NULL,
    "intake" TEXT,
    "specimen" TEXT,
    "inventoryUnit" TEXT,
    "status" TEXT DEFAULT 'pending',
    "reserveAmountMinor" INTEGER,
    "agreedPriceMinor" INTEGER,
    "currencyCode" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsignmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsignmentSettlement" (
    "id" TEXT NOT NULL,
    "store" TEXT,
    "consignor" TEXT,
    "reference" TEXT NOT NULL DEFAULT '',
    "status" TEXT DEFAULT 'pending',
    "currencyCode" TEXT NOT NULL DEFAULT '',
    "grossAmountMinor" INTEGER NOT NULL,
    "feeAmountMinor" INTEGER NOT NULL,
    "refundHoldbackMinor" INTEGER NOT NULL DEFAULT 0,
    "payableAmountMinor" INTEGER NOT NULL,
    "calculationSnapshot" JSONB DEFAULT '{}',
    "payoutEvidence" JSONB,
    "idempotencyKey" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsignmentSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementLine" (
    "id" TEXT NOT NULL,
    "settlement" TEXT,
    "consignmentItem" TEXT,
    "orderLineItem" TEXT,
    "grossAmountMinor" INTEGER NOT NULL,
    "commissionAmountMinor" INTEGER NOT NULL,
    "feeAmountMinor" INTEGER NOT NULL,
    "refundAmountMinor" INTEGER NOT NULL DEFAULT 0,
    "payableAmountMinor" INTEGER NOT NULL,
    "snapshot" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettlementLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeInItem" (
    "id" TEXT NOT NULL,
    "submission" TEXT,
    "catalogItem" TEXT,
    "specimen" TEXT,
    "customerDescription" TEXT NOT NULL DEFAULT '',
    "customerCondition" TEXT NOT NULL DEFAULT '',
    "inspectedConditionObservation" TEXT,
    "quotedAmountMinor" INTEGER,
    "acceptedAmountMinor" INTEGER,
    "currencyCode" TEXT NOT NULL DEFAULT '',
    "decisionEvidence" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeInItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeInSubmission" (
    "id" TEXT NOT NULL,
    "store" TEXT,
    "customer" TEXT,
    "reference" TEXT NOT NULL DEFAULT '',
    "status" TEXT DEFAULT 'submitted',
    "disposition" TEXT DEFAULT 'cash',
    "shippingEvidence" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeInSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectorProfile" (
    "id" TEXT NOT NULL,
    "user" TEXT,
    "displayName" TEXT NOT NULL DEFAULT '',
    "bio" TEXT NOT NULL DEFAULT '',
    "interests" JSONB DEFAULT '[]',
    "preferences" JSONB DEFAULT '{}',
    "public" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisputeCase" (
    "id" TEXT NOT NULL,
    "store" TEXT,
    "order" TEXT,
    "return" TEXT,
    "openedBy" TEXT,
    "assignedTo" TEXT,
    "type" TEXT DEFAULT 'other',
    "status" TEXT DEFAULT 'open',
    "summary" TEXT NOT NULL DEFAULT '',
    "resolution" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceAttachment" (
    "id" TEXT NOT NULL,
    "dispute" TEXT,
    "url" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT '',
    "checksum" TEXT NOT NULL DEFAULT '',
    "uploadedBy" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FulfillmentRequirement" (
    "id" TEXT NOT NULL,
    "order" TEXT,
    "orderLineItem" TEXT,
    "declaredValueMinor" INTEGER,
    "currencyCode" TEXT NOT NULL DEFAULT '',
    "signatureRequired" BOOLEAN NOT NULL DEFAULT false,
    "insuranceRequested" BOOLEAN NOT NULL DEFAULT false,
    "insuranceProviderReference" TEXT NOT NULL DEFAULT '',
    "packagingInstructions" TEXT NOT NULL DEFAULT '',
    "policySnapshot" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FulfillmentRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationIntent" (
    "id" TEXT NOT NULL,
    "user" TEXT,
    "channel" TEXT DEFAULT 'email',
    "template" TEXT NOT NULL DEFAULT '',
    "status" TEXT DEFAULT 'queued',
    "payload" JSONB DEFAULT '{}',
    "provider" TEXT NOT NULL DEFAULT '',
    "providerReference" TEXT NOT NULL DEFAULT '',
    "idempotencyKey" TEXT NOT NULL DEFAULT '',
    "attemptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderConnection" (
    "id" TEXT NOT NULL,
    "store" TEXT,
    "kind" TEXT DEFAULT 'notification',
    "provider" TEXT NOT NULL DEFAULT '',
    "status" TEXT DEFAULT 'draft',
    "adapterKey" TEXT NOT NULL DEFAULT '',
    "configuration" JSONB DEFAULT '{}',
    "secretReference" TEXT NOT NULL DEFAULT '',
    "lastObservedAt" TIMESTAMP(3),
    "lastObservation" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskAssessment" (
    "id" TEXT NOT NULL,
    "store" TEXT,
    "subjectType" TEXT DEFAULT 'order',
    "subjectId" TEXT NOT NULL DEFAULT '',
    "provider" TEXT NOT NULL DEFAULT '',
    "status" TEXT DEFAULT 'provider_reported',
    "score" INTEGER,
    "reasonCodes" JSONB DEFAULT '[]',
    "observedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "restrictedPayload" JSONB,
    "disclaimer" TEXT NOT NULL DEFAULT 'Risk evidence is provider/operator attributed and is not proof of fraud or identity.',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskSignal" (
    "id" TEXT NOT NULL,
    "assessment" TEXT,
    "code" TEXT NOT NULL DEFAULT '',
    "severity" TEXT DEFAULT 'info',
    "summary" TEXT NOT NULL DEFAULT '',
    "evidence" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerProfile" (
    "id" TEXT NOT NULL,
    "store" TEXT,
    "user" TEXT,
    "displayName" TEXT NOT NULL DEFAULT '',
    "status" TEXT DEFAULT 'applicant',
    "publicBio" TEXT NOT NULL DEFAULT '',
    "privateContact" JSONB,
    "identityEvidenceState" TEXT DEFAULT 'not_requested',
    "payoutConfigurationReference" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SellerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentEvidence" (
    "id" TEXT NOT NULL,
    "fulfillment" TEXT,
    "requirement" TEXT,
    "type" TEXT DEFAULT 'tracking',
    "provider" TEXT NOT NULL DEFAULT '',
    "providerReference" TEXT NOT NULL DEFAULT '',
    "observedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT '',
    "publicSummary" TEXT NOT NULL DEFAULT '',
    "restrictedPayload" JSONB,
    "disclaimer" TEXT NOT NULL DEFAULT 'Provider-attributed fulfillment evidence; not an independent guarantee of delivery or coverage.',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShipmentEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreMembership" (
    "id" TEXT NOT NULL,
    "store" TEXT,
    "user" TEXT,
    "role" TEXT DEFAULT 'viewer',
    "status" TEXT DEFAULT 'invited',
    "permissions" JSONB DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AttributeDefinition_store_idx" ON "AttributeDefinition"("store");

-- CreateIndex
CREATE INDEX "AttributeDefinition_category_idx" ON "AttributeDefinition"("category");

-- CreateIndex
CREATE INDEX "AttributeDefinition_key_idx" ON "AttributeDefinition"("key");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogItem_handle_key" ON "CatalogItem"("handle");

-- CreateIndex
CREATE INDEX "CatalogItem_store_idx" ON "CatalogItem"("store");

-- CreateIndex
CREATE INDEX "CatalogItem_category_idx" ON "CatalogItem"("category");

-- CreateIndex
CREATE INDEX "CatalogItem_franchise_idx" ON "CatalogItem"("franchise");

-- CreateIndex
CREATE INDEX "CatalogItem_collectibleSet_idx" ON "CatalogItem"("collectibleSet");

-- CreateIndex
CREATE INDEX "CatalogItem_release_idx" ON "CatalogItem"("release");

-- CreateIndex
CREATE UNIQUE INDEX "CollectibleCategory_handle_key" ON "CollectibleCategory"("handle");

-- CreateIndex
CREATE INDEX "CollectibleCategory_store_idx" ON "CollectibleCategory"("store");

-- CreateIndex
CREATE INDEX "CollectibleCategory_parent_idx" ON "CollectibleCategory"("parent");

-- CreateIndex
CREATE INDEX "CollectibleMedia_store_idx" ON "CollectibleMedia"("store");

-- CreateIndex
CREATE INDEX "CollectibleMedia_catalogItem_idx" ON "CollectibleMedia"("catalogItem");

-- CreateIndex
CREATE INDEX "CollectibleMedia_specimen_idx" ON "CollectibleMedia"("specimen");

-- CreateIndex
CREATE UNIQUE INDEX "CollectibleRelease_handle_key" ON "CollectibleRelease"("handle");

-- CreateIndex
CREATE INDEX "CollectibleRelease_store_idx" ON "CollectibleRelease"("store");

-- CreateIndex
CREATE INDEX "CollectibleRelease_collectibleSet_idx" ON "CollectibleRelease"("collectibleSet");

-- CreateIndex
CREATE UNIQUE INDEX "CollectibleSet_handle_key" ON "CollectibleSet"("handle");

-- CreateIndex
CREATE INDEX "CollectibleSet_store_idx" ON "CollectibleSet"("store");

-- CreateIndex
CREATE INDEX "CollectibleSet_franchise_idx" ON "CollectibleSet"("franchise");

-- CreateIndex
CREATE INDEX "CollectibleSet_category_idx" ON "CollectibleSet"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Franchise_handle_key" ON "Franchise"("handle");

-- CreateIndex
CREATE INDEX "Franchise_store_idx" ON "Franchise"("store");

-- CreateIndex
CREATE UNIQUE INDEX "Specimen_specimenCode_key" ON "Specimen"("specimenCode");

-- CreateIndex
CREATE INDEX "Specimen_store_idx" ON "Specimen"("store");

-- CreateIndex
CREATE INDEX "Specimen_catalogItem_idx" ON "Specimen"("catalogItem");

-- CreateIndex
CREATE INDEX "SpecimenIdentifier_specimen_idx" ON "SpecimenIdentifier"("specimen");

-- CreateIndex
CREATE INDEX "SpecimenIdentifier_value_idx" ON "SpecimenIdentifier"("value");

-- CreateIndex
CREATE INDEX "ConditionObservation_specimen_idx" ON "ConditionObservation"("specimen");

-- CreateIndex
CREATE INDEX "ConditionObservation_observer_idx" ON "ConditionObservation"("observer");

-- CreateIndex
CREATE UNIQUE INDEX "CustodyEvent_idempotencyKey_key" ON "CustodyEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "CustodyEvent_specimen_idx" ON "CustodyEvent"("specimen");

-- CreateIndex
CREATE INDEX "CustodyEvent_fromLocation_idx" ON "CustodyEvent"("fromLocation");

-- CreateIndex
CREATE INDEX "CustodyEvent_toLocation_idx" ON "CustodyEvent"("toLocation");

-- CreateIndex
CREATE INDEX "CustodyEvent_actor_idx" ON "CustodyEvent"("actor");

-- CreateIndex
CREATE INDEX "GradeObservation_specimen_idx" ON "GradeObservation"("specimen");

-- CreateIndex
CREATE INDEX "GradeObservation_gradingCompany_idx" ON "GradeObservation"("gradingCompany");

-- CreateIndex
CREATE INDEX "GradeObservation_certificateReference_idx" ON "GradeObservation"("certificateReference");

-- CreateIndex
CREATE INDEX "GradeObservation_reviewedBy_idx" ON "GradeObservation"("reviewedBy");

-- CreateIndex
CREATE UNIQUE INDEX "GradingCompany_code_key" ON "GradingCompany"("code");

-- CreateIndex
CREATE INDEX "ProvenanceEvent_specimen_idx" ON "ProvenanceEvent"("specimen");

-- CreateIndex
CREATE INDEX "ProvenanceEvent_reviewedBy_idx" ON "ProvenanceEvent"("reviewedBy");

-- CreateIndex
CREATE INDEX "ValuationObservation_specimen_idx" ON "ValuationObservation"("specimen");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryLocation_code_key" ON "InventoryLocation"("code");

-- CreateIndex
CREATE INDEX "InventoryLocation_store_idx" ON "InventoryLocation"("store");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryMovement_idempotencyKey_key" ON "InventoryMovement"("idempotencyKey");

-- CreateIndex
CREATE INDEX "InventoryMovement_inventoryUnit_idx" ON "InventoryMovement"("inventoryUnit");

-- CreateIndex
CREATE INDEX "InventoryMovement_fromLocation_idx" ON "InventoryMovement"("fromLocation");

-- CreateIndex
CREATE INDEX "InventoryMovement_toLocation_idx" ON "InventoryMovement"("toLocation");

-- CreateIndex
CREATE INDEX "InventoryMovement_actor_idx" ON "InventoryMovement"("actor");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryUnit_commerceVariant_key" ON "InventoryUnit"("commerceVariant");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryUnit_sku_key" ON "InventoryUnit"("sku");

-- CreateIndex
CREATE INDEX "InventoryUnit_store_idx" ON "InventoryUnit"("store");

-- CreateIndex
CREATE INDEX "InventoryUnit_specimen_idx" ON "InventoryUnit"("specimen");

-- CreateIndex
CREATE INDEX "InventoryUnit_location_idx" ON "InventoryUnit"("location");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_idempotencyKey_key" ON "Reservation"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Reservation_inventoryUnit_idx" ON "Reservation"("inventoryUnit");

-- CreateIndex
CREATE INDEX "Reservation_listing_idx" ON "Reservation"("listing");

-- CreateIndex
CREATE INDEX "Reservation_cart_idx" ON "Reservation"("cart");

-- CreateIndex
CREATE INDEX "Reservation_offer_idx" ON "Reservation"("offer");

-- CreateIndex
CREATE INDEX "Reservation_auction_idx" ON "Reservation"("auction");

-- CreateIndex
CREATE INDEX "Reservation_ownerUser_idx" ON "Reservation"("ownerUser");

-- CreateIndex
CREATE UNIQUE INDEX "Auction_listing_key" ON "Auction"("listing");

-- CreateIndex
CREATE INDEX "Auction_leadingBidder_idx" ON "Auction"("leadingBidder");

-- CreateIndex
CREATE INDEX "Auction_reservation_idx" ON "Auction"("reservation");

-- CreateIndex
CREATE UNIQUE INDEX "Bid_idempotencyKey_key" ON "Bid"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Bid_auction_idx" ON "Bid"("auction");

-- CreateIndex
CREATE INDEX "Bid_bidder_idx" ON "Bid"("bidder");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_slug_key" ON "Listing"("slug");

-- CreateIndex
CREATE INDEX "Listing_store_idx" ON "Listing"("store");

-- CreateIndex
CREATE INDEX "Listing_inventoryUnit_idx" ON "Listing"("inventoryUnit");

-- CreateIndex
CREATE INDEX "Listing_seller_idx" ON "Listing"("seller");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_idempotencyKey_key" ON "Offer"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Offer_listing_idx" ON "Offer"("listing");

-- CreateIndex
CREATE INDEX "Offer_buyer_idx" ON "Offer"("buyer");

-- CreateIndex
CREATE INDEX "Offer_seller_idx" ON "Offer"("seller");

-- CreateIndex
CREATE INDEX "Offer_reservation_idx" ON "Offer"("reservation");

-- CreateIndex
CREATE UNIQUE INDEX "OfferRevision_idempotencyKey_key" ON "OfferRevision"("idempotencyKey");

-- CreateIndex
CREATE INDEX "OfferRevision_offer_idx" ON "OfferRevision"("offer");

-- CreateIndex
CREATE INDEX "OfferRevision_actor_idx" ON "OfferRevision"("actor");

-- CreateIndex
CREATE INDEX "SavedSearch_user_idx" ON "SavedSearch"("user");

-- CreateIndex
CREATE INDEX "WishlistItem_user_idx" ON "WishlistItem"("user");

-- CreateIndex
CREATE INDEX "WishlistItem_catalogItem_idx" ON "WishlistItem"("catalogItem");

-- CreateIndex
CREATE INDEX "WishlistItem_listing_idx" ON "WishlistItem"("listing");

-- CreateIndex
CREATE INDEX "Buylist_store_idx" ON "Buylist"("store");

-- CreateIndex
CREATE INDEX "BuylistEntry_buylist_idx" ON "BuylistEntry"("buylist");

-- CreateIndex
CREATE INDEX "BuylistEntry_catalogItem_idx" ON "BuylistEntry"("catalogItem");

-- CreateIndex
CREATE UNIQUE INDEX "ConsignmentAgreement_intake_key" ON "ConsignmentAgreement"("intake");

-- CreateIndex
CREATE INDEX "ConsignmentAgreement_consignor_idx" ON "ConsignmentAgreement"("consignor");

-- CreateIndex
CREATE UNIQUE INDEX "ConsignmentIntake_reference_key" ON "ConsignmentIntake"("reference");

-- CreateIndex
CREATE INDEX "ConsignmentIntake_store_idx" ON "ConsignmentIntake"("store");

-- CreateIndex
CREATE INDEX "ConsignmentIntake_consignor_idx" ON "ConsignmentIntake"("consignor");

-- CreateIndex
CREATE INDEX "ConsignmentItem_intake_idx" ON "ConsignmentItem"("intake");

-- CreateIndex
CREATE INDEX "ConsignmentItem_specimen_idx" ON "ConsignmentItem"("specimen");

-- CreateIndex
CREATE INDEX "ConsignmentItem_inventoryUnit_idx" ON "ConsignmentItem"("inventoryUnit");

-- CreateIndex
CREATE UNIQUE INDEX "ConsignmentSettlement_reference_key" ON "ConsignmentSettlement"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "ConsignmentSettlement_idempotencyKey_key" ON "ConsignmentSettlement"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ConsignmentSettlement_store_idx" ON "ConsignmentSettlement"("store");

-- CreateIndex
CREATE INDEX "ConsignmentSettlement_consignor_idx" ON "ConsignmentSettlement"("consignor");

-- CreateIndex
CREATE INDEX "SettlementLine_settlement_idx" ON "SettlementLine"("settlement");

-- CreateIndex
CREATE INDEX "SettlementLine_consignmentItem_idx" ON "SettlementLine"("consignmentItem");

-- CreateIndex
CREATE INDEX "SettlementLine_orderLineItem_idx" ON "SettlementLine"("orderLineItem");

-- CreateIndex
CREATE INDEX "TradeInItem_submission_idx" ON "TradeInItem"("submission");

-- CreateIndex
CREATE INDEX "TradeInItem_catalogItem_idx" ON "TradeInItem"("catalogItem");

-- CreateIndex
CREATE INDEX "TradeInItem_specimen_idx" ON "TradeInItem"("specimen");

-- CreateIndex
CREATE INDEX "TradeInItem_inspectedConditionObservation_idx" ON "TradeInItem"("inspectedConditionObservation");

-- CreateIndex
CREATE UNIQUE INDEX "TradeInSubmission_reference_key" ON "TradeInSubmission"("reference");

-- CreateIndex
CREATE INDEX "TradeInSubmission_store_idx" ON "TradeInSubmission"("store");

-- CreateIndex
CREATE INDEX "TradeInSubmission_customer_idx" ON "TradeInSubmission"("customer");

-- CreateIndex
CREATE INDEX "CollectorProfile_user_idx" ON "CollectorProfile"("user");

-- CreateIndex
CREATE INDEX "DisputeCase_store_idx" ON "DisputeCase"("store");

-- CreateIndex
CREATE INDEX "DisputeCase_order_idx" ON "DisputeCase"("order");

-- CreateIndex
CREATE INDEX "DisputeCase_return_idx" ON "DisputeCase"("return");

-- CreateIndex
CREATE INDEX "DisputeCase_openedBy_idx" ON "DisputeCase"("openedBy");

-- CreateIndex
CREATE INDEX "DisputeCase_assignedTo_idx" ON "DisputeCase"("assignedTo");

-- CreateIndex
CREATE INDEX "EvidenceAttachment_dispute_idx" ON "EvidenceAttachment"("dispute");

-- CreateIndex
CREATE INDEX "EvidenceAttachment_uploadedBy_idx" ON "EvidenceAttachment"("uploadedBy");

-- CreateIndex
CREATE INDEX "FulfillmentRequirement_order_idx" ON "FulfillmentRequirement"("order");

-- CreateIndex
CREATE INDEX "FulfillmentRequirement_orderLineItem_idx" ON "FulfillmentRequirement"("orderLineItem");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationIntent_idempotencyKey_key" ON "NotificationIntent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "NotificationIntent_user_idx" ON "NotificationIntent"("user");

-- CreateIndex
CREATE INDEX "ProviderConnection_store_idx" ON "ProviderConnection"("store");

-- CreateIndex
CREATE INDEX "RiskAssessment_store_idx" ON "RiskAssessment"("store");

-- CreateIndex
CREATE INDEX "RiskSignal_assessment_idx" ON "RiskSignal"("assessment");

-- CreateIndex
CREATE INDEX "SellerProfile_store_idx" ON "SellerProfile"("store");

-- CreateIndex
CREATE INDEX "SellerProfile_user_idx" ON "SellerProfile"("user");

-- CreateIndex
CREATE INDEX "ShipmentEvidence_fulfillment_idx" ON "ShipmentEvidence"("fulfillment");

-- CreateIndex
CREATE INDEX "ShipmentEvidence_requirement_idx" ON "ShipmentEvidence"("requirement");

-- CreateIndex
CREATE INDEX "StoreMembership_store_idx" ON "StoreMembership"("store");

-- CreateIndex
CREATE INDEX "StoreMembership_user_idx" ON "StoreMembership"("user");

-- AddForeignKey
ALTER TABLE "AttributeDefinition" ADD CONSTRAINT "AttributeDefinition_store_fkey" FOREIGN KEY ("store") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttributeDefinition" ADD CONSTRAINT "AttributeDefinition_category_fkey" FOREIGN KEY ("category") REFERENCES "CollectibleCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_store_fkey" FOREIGN KEY ("store") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_category_fkey" FOREIGN KEY ("category") REFERENCES "CollectibleCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_franchise_fkey" FOREIGN KEY ("franchise") REFERENCES "Franchise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_collectibleSet_fkey" FOREIGN KEY ("collectibleSet") REFERENCES "CollectibleSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_release_fkey" FOREIGN KEY ("release") REFERENCES "CollectibleRelease"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectibleCategory" ADD CONSTRAINT "CollectibleCategory_store_fkey" FOREIGN KEY ("store") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectibleCategory" ADD CONSTRAINT "CollectibleCategory_parent_fkey" FOREIGN KEY ("parent") REFERENCES "CollectibleCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectibleMedia" ADD CONSTRAINT "CollectibleMedia_store_fkey" FOREIGN KEY ("store") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectibleMedia" ADD CONSTRAINT "CollectibleMedia_catalogItem_fkey" FOREIGN KEY ("catalogItem") REFERENCES "CatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectibleMedia" ADD CONSTRAINT "CollectibleMedia_specimen_fkey" FOREIGN KEY ("specimen") REFERENCES "Specimen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectibleRelease" ADD CONSTRAINT "CollectibleRelease_store_fkey" FOREIGN KEY ("store") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectibleRelease" ADD CONSTRAINT "CollectibleRelease_collectibleSet_fkey" FOREIGN KEY ("collectibleSet") REFERENCES "CollectibleSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectibleSet" ADD CONSTRAINT "CollectibleSet_store_fkey" FOREIGN KEY ("store") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectibleSet" ADD CONSTRAINT "CollectibleSet_franchise_fkey" FOREIGN KEY ("franchise") REFERENCES "Franchise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectibleSet" ADD CONSTRAINT "CollectibleSet_category_fkey" FOREIGN KEY ("category") REFERENCES "CollectibleCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Franchise" ADD CONSTRAINT "Franchise_store_fkey" FOREIGN KEY ("store") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Specimen" ADD CONSTRAINT "Specimen_store_fkey" FOREIGN KEY ("store") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Specimen" ADD CONSTRAINT "Specimen_catalogItem_fkey" FOREIGN KEY ("catalogItem") REFERENCES "CatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecimenIdentifier" ADD CONSTRAINT "SpecimenIdentifier_specimen_fkey" FOREIGN KEY ("specimen") REFERENCES "Specimen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionObservation" ADD CONSTRAINT "ConditionObservation_specimen_fkey" FOREIGN KEY ("specimen") REFERENCES "Specimen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionObservation" ADD CONSTRAINT "ConditionObservation_observer_fkey" FOREIGN KEY ("observer") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustodyEvent" ADD CONSTRAINT "CustodyEvent_specimen_fkey" FOREIGN KEY ("specimen") REFERENCES "Specimen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustodyEvent" ADD CONSTRAINT "CustodyEvent_fromLocation_fkey" FOREIGN KEY ("fromLocation") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustodyEvent" ADD CONSTRAINT "CustodyEvent_toLocation_fkey" FOREIGN KEY ("toLocation") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustodyEvent" ADD CONSTRAINT "CustodyEvent_actor_fkey" FOREIGN KEY ("actor") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeObservation" ADD CONSTRAINT "GradeObservation_specimen_fkey" FOREIGN KEY ("specimen") REFERENCES "Specimen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeObservation" ADD CONSTRAINT "GradeObservation_gradingCompany_fkey" FOREIGN KEY ("gradingCompany") REFERENCES "GradingCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeObservation" ADD CONSTRAINT "GradeObservation_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProvenanceEvent" ADD CONSTRAINT "ProvenanceEvent_specimen_fkey" FOREIGN KEY ("specimen") REFERENCES "Specimen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProvenanceEvent" ADD CONSTRAINT "ProvenanceEvent_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValuationObservation" ADD CONSTRAINT "ValuationObservation_specimen_fkey" FOREIGN KEY ("specimen") REFERENCES "Specimen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLocation" ADD CONSTRAINT "InventoryLocation_store_fkey" FOREIGN KEY ("store") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_inventoryUnit_fkey" FOREIGN KEY ("inventoryUnit") REFERENCES "InventoryUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_fromLocation_fkey" FOREIGN KEY ("fromLocation") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_toLocation_fkey" FOREIGN KEY ("toLocation") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_actor_fkey" FOREIGN KEY ("actor") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryUnit" ADD CONSTRAINT "InventoryUnit_store_fkey" FOREIGN KEY ("store") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryUnit" ADD CONSTRAINT "InventoryUnit_specimen_fkey" FOREIGN KEY ("specimen") REFERENCES "Specimen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryUnit" ADD CONSTRAINT "InventoryUnit_commerceVariant_fkey" FOREIGN KEY ("commerceVariant") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryUnit" ADD CONSTRAINT "InventoryUnit_location_fkey" FOREIGN KEY ("location") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_inventoryUnit_fkey" FOREIGN KEY ("inventoryUnit") REFERENCES "InventoryUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_listing_fkey" FOREIGN KEY ("listing") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_cart_fkey" FOREIGN KEY ("cart") REFERENCES "Cart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_offer_fkey" FOREIGN KEY ("offer") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_auction_fkey" FOREIGN KEY ("auction") REFERENCES "Auction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_ownerUser_fkey" FOREIGN KEY ("ownerUser") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_listing_fkey" FOREIGN KEY ("listing") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_leadingBidder_fkey" FOREIGN KEY ("leadingBidder") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_reservation_fkey" FOREIGN KEY ("reservation") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_auction_fkey" FOREIGN KEY ("auction") REFERENCES "Auction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_bidder_fkey" FOREIGN KEY ("bidder") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_store_fkey" FOREIGN KEY ("store") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_inventoryUnit_fkey" FOREIGN KEY ("inventoryUnit") REFERENCES "InventoryUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_seller_fkey" FOREIGN KEY ("seller") REFERENCES "SellerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_listing_fkey" FOREIGN KEY ("listing") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_buyer_fkey" FOREIGN KEY ("buyer") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_seller_fkey" FOREIGN KEY ("seller") REFERENCES "SellerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_reservation_fkey" FOREIGN KEY ("reservation") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferRevision" ADD CONSTRAINT "OfferRevision_offer_fkey" FOREIGN KEY ("offer") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferRevision" ADD CONSTRAINT "OfferRevision_actor_fkey" FOREIGN KEY ("actor") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedSearch" ADD CONSTRAINT "SavedSearch_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_catalogItem_fkey" FOREIGN KEY ("catalogItem") REFERENCES "CatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_listing_fkey" FOREIGN KEY ("listing") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Buylist" ADD CONSTRAINT "Buylist_store_fkey" FOREIGN KEY ("store") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuylistEntry" ADD CONSTRAINT "BuylistEntry_buylist_fkey" FOREIGN KEY ("buylist") REFERENCES "Buylist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuylistEntry" ADD CONSTRAINT "BuylistEntry_catalogItem_fkey" FOREIGN KEY ("catalogItem") REFERENCES "CatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsignmentAgreement" ADD CONSTRAINT "ConsignmentAgreement_intake_fkey" FOREIGN KEY ("intake") REFERENCES "ConsignmentIntake"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsignmentAgreement" ADD CONSTRAINT "ConsignmentAgreement_consignor_fkey" FOREIGN KEY ("consignor") REFERENCES "SellerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsignmentIntake" ADD CONSTRAINT "ConsignmentIntake_store_fkey" FOREIGN KEY ("store") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsignmentIntake" ADD CONSTRAINT "ConsignmentIntake_consignor_fkey" FOREIGN KEY ("consignor") REFERENCES "SellerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsignmentItem" ADD CONSTRAINT "ConsignmentItem_intake_fkey" FOREIGN KEY ("intake") REFERENCES "ConsignmentIntake"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsignmentItem" ADD CONSTRAINT "ConsignmentItem_specimen_fkey" FOREIGN KEY ("specimen") REFERENCES "Specimen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsignmentItem" ADD CONSTRAINT "ConsignmentItem_inventoryUnit_fkey" FOREIGN KEY ("inventoryUnit") REFERENCES "InventoryUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsignmentSettlement" ADD CONSTRAINT "ConsignmentSettlement_store_fkey" FOREIGN KEY ("store") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsignmentSettlement" ADD CONSTRAINT "ConsignmentSettlement_consignor_fkey" FOREIGN KEY ("consignor") REFERENCES "SellerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementLine" ADD CONSTRAINT "SettlementLine_settlement_fkey" FOREIGN KEY ("settlement") REFERENCES "ConsignmentSettlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementLine" ADD CONSTRAINT "SettlementLine_consignmentItem_fkey" FOREIGN KEY ("consignmentItem") REFERENCES "ConsignmentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementLine" ADD CONSTRAINT "SettlementLine_orderLineItem_fkey" FOREIGN KEY ("orderLineItem") REFERENCES "OrderLineItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeInItem" ADD CONSTRAINT "TradeInItem_submission_fkey" FOREIGN KEY ("submission") REFERENCES "TradeInSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeInItem" ADD CONSTRAINT "TradeInItem_catalogItem_fkey" FOREIGN KEY ("catalogItem") REFERENCES "CatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeInItem" ADD CONSTRAINT "TradeInItem_specimen_fkey" FOREIGN KEY ("specimen") REFERENCES "Specimen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeInItem" ADD CONSTRAINT "TradeInItem_inspectedConditionObservation_fkey" FOREIGN KEY ("inspectedConditionObservation") REFERENCES "ConditionObservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeInSubmission" ADD CONSTRAINT "TradeInSubmission_store_fkey" FOREIGN KEY ("store") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeInSubmission" ADD CONSTRAINT "TradeInSubmission_customer_fkey" FOREIGN KEY ("customer") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectorProfile" ADD CONSTRAINT "CollectorProfile_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeCase" ADD CONSTRAINT "DisputeCase_store_fkey" FOREIGN KEY ("store") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeCase" ADD CONSTRAINT "DisputeCase_order_fkey" FOREIGN KEY ("order") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeCase" ADD CONSTRAINT "DisputeCase_return_fkey" FOREIGN KEY ("return") REFERENCES "Return"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeCase" ADD CONSTRAINT "DisputeCase_openedBy_fkey" FOREIGN KEY ("openedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeCase" ADD CONSTRAINT "DisputeCase_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceAttachment" ADD CONSTRAINT "EvidenceAttachment_dispute_fkey" FOREIGN KEY ("dispute") REFERENCES "DisputeCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceAttachment" ADD CONSTRAINT "EvidenceAttachment_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FulfillmentRequirement" ADD CONSTRAINT "FulfillmentRequirement_order_fkey" FOREIGN KEY ("order") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FulfillmentRequirement" ADD CONSTRAINT "FulfillmentRequirement_orderLineItem_fkey" FOREIGN KEY ("orderLineItem") REFERENCES "OrderLineItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationIntent" ADD CONSTRAINT "NotificationIntent_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderConnection" ADD CONSTRAINT "ProviderConnection_store_fkey" FOREIGN KEY ("store") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_store_fkey" FOREIGN KEY ("store") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskSignal" ADD CONSTRAINT "RiskSignal_assessment_fkey" FOREIGN KEY ("assessment") REFERENCES "RiskAssessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerProfile" ADD CONSTRAINT "SellerProfile_store_fkey" FOREIGN KEY ("store") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerProfile" ADD CONSTRAINT "SellerProfile_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentEvidence" ADD CONSTRAINT "ShipmentEvidence_fulfillment_fkey" FOREIGN KEY ("fulfillment") REFERENCES "Fulfillment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentEvidence" ADD CONSTRAINT "ShipmentEvidence_requirement_fkey" FOREIGN KEY ("requirement") REFERENCES "FulfillmentRequirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreMembership" ADD CONSTRAINT "StoreMembership_store_fkey" FOREIGN KEY ("store") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreMembership" ADD CONSTRAINT "StoreMembership_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
