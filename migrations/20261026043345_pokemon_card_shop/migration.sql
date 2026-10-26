-- AlterTable
ALTER TABLE "Buylist" ADD COLUMN     "cashPercentBasisPoints" INTEGER DEFAULT 6000,
ADD COLUMN     "conditionBasisPoints" JSONB DEFAULT '{"NM":10000,"LP":8500,"MP":7000,"HP":5000,"DMG":3000}',
ADD COLUMN     "creditPercentBasisPoints" INTEGER DEFAULT 8000,
ADD COLUMN     "minimumOfferMinor" INTEGER DEFAULT 25,
ADD COLUMN     "publicNotes" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "BuylistEntry" ADD COLUMN     "cardFinish" TEXT,
ADD COLUMN     "creditOfferMinor" INTEGER,
ADD COLUMN     "hotlist" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "minimumCondition" TEXT DEFAULT 'MP',
ADD COLUMN     "pricingMode" TEXT DEFAULT 'market',
ADD COLUMN     "quantityBought" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "CatalogItem" ADD COLUMN     "artist" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "cardNumber" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "energyTypes" JSONB DEFAULT '[]',
ADD COLUMN     "hp" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "imageLargeUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "imageUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "kind" TEXT DEFAULT 'single',
ADD COLUMN     "numberSort" INTEGER DEFAULT 0,
ADD COLUMN     "rarity" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "sealedFormat" TEXT,
ADD COLUMN     "subtypes" JSONB DEFAULT '[]',
ADD COLUMN     "supertype" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "tcgplayerProductId" INTEGER;

-- AlterTable
ALTER TABLE "CollectibleSet" ADD COLUMN     "code" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "logoUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "printedTotal" INTEGER,
ADD COLUMN     "releaseDate" TIMESTAMP(3),
ADD COLUMN     "releaseStatus" TEXT DEFAULT 'released',
ADD COLUMN     "series" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "symbolUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "tcgplayerGroupId" INTEGER,
ADD COLUMN     "totalCards" INTEGER;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "catalogItem" TEXT;

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "cardCondition" TEXT,
ADD COLUMN     "cardFinish" TEXT,
ADD COLUMN     "cardLanguage" TEXT DEFAULT 'EN',
ADD COLUMN     "lastRepricedAt" TIMESTAMP(3),
ADD COLUMN     "preorder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preorderLimitPerCustomer" INTEGER,
ADD COLUMN     "preorderReleaseDate" TIMESTAMP(3),
ADD COLUMN     "pricingMode" TEXT DEFAULT 'manual',
ADD COLUMN     "stockKind" TEXT DEFAULT 'raw';

-- AlterTable
ALTER TABLE "TradeInItem" ADD COLUMN     "buylistEntry" TEXT,
ADD COLUMN     "cardCondition" TEXT,
ADD COLUMN     "cardFinish" TEXT,
ADD COLUMN     "quantity" INTEGER DEFAULT 1,
ADD COLUMN     "quotedCreditMinor" INTEGER;

-- AlterTable
ALTER TABLE "WishlistItem" ADD COLUMN     "cardFinish" TEXT,
ADD COLUMN     "maxPriceMinor" INTEGER,
ADD COLUMN     "minimumCondition" TEXT,
ADD COLUMN     "notifyWhenInStock" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "quantity" INTEGER DEFAULT 1;

-- CreateTable
CREATE TABLE "MarketPrice" (
    "id" TEXT NOT NULL,
    "catalogItem" TEXT,
    "finish" TEXT,
    "condition" TEXT,
    "grade" TEXT NOT NULL DEFAULT '',
    "source" TEXT DEFAULT 'tcgplayer',
    "sourceReference" TEXT NOT NULL DEFAULT '',
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "lowMinor" INTEGER,
    "midMinor" INTEGER,
    "highMinor" INTEGER,
    "marketMinor" INTEGER,
    "observedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "appliesTo" TEXT DEFAULT 'raw',
    "condition" TEXT,
    "basis" TEXT DEFAULT 'market',
    "percentBasisPoints" INTEGER NOT NULL DEFAULT 10000,
    "minimumMinor" INTEGER DEFAULT 25,
    "maximumChangeBasisPoints" INTEGER DEFAULT 3000,
    "rounding" TEXT DEFAULT 'ninety_nine',
    "priority" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Binder" (
    "id" TEXT NOT NULL,
    "user" TEXT,
    "name" TEXT NOT NULL DEFAULT 'My binder',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Binder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BinderCard" (
    "id" TEXT NOT NULL,
    "binder" TEXT,
    "catalogItem" TEXT,
    "cardFinish" TEXT,
    "cardCondition" TEXT DEFAULT 'NM',
    "cardLanguage" TEXT DEFAULT 'EN',
    "grade" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER DEFAULT 1,
    "costBasisMinor" INTEGER,
    "acquiredAt" TIMESTAMP(3),
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BinderCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketPrice_catalogItem_idx" ON "MarketPrice"("catalogItem");

-- CreateIndex
CREATE INDEX "MarketPrice_observedAt_idx" ON "MarketPrice"("observedAt");

-- CreateIndex
CREATE INDEX "Binder_user_idx" ON "Binder"("user");

-- CreateIndex
CREATE INDEX "BinderCard_binder_idx" ON "BinderCard"("binder");

-- CreateIndex
CREATE INDEX "BinderCard_catalogItem_idx" ON "BinderCard"("catalogItem");

-- CreateIndex
CREATE INDEX "CatalogItem_tcgplayerProductId_idx" ON "CatalogItem"("tcgplayerProductId");

-- CreateIndex
CREATE INDEX "Product_catalogItem_idx" ON "Product"("catalogItem");

-- CreateIndex
CREATE INDEX "TradeInItem_buylistEntry_idx" ON "TradeInItem"("buylistEntry");

-- AddForeignKey
ALTER TABLE "MarketPrice" ADD CONSTRAINT "MarketPrice_catalogItem_fkey" FOREIGN KEY ("catalogItem") REFERENCES "CatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Binder" ADD CONSTRAINT "Binder_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BinderCard" ADD CONSTRAINT "BinderCard_binder_fkey" FOREIGN KEY ("binder") REFERENCES "Binder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BinderCard" ADD CONSTRAINT "BinderCard_catalogItem_fkey" FOREIGN KEY ("catalogItem") REFERENCES "CatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeInItem" ADD CONSTRAINT "TradeInItem_buylistEntry_fkey" FOREIGN KEY ("buylistEntry") REFERENCES "BuylistEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_catalogItem_fkey" FOREIGN KEY ("catalogItem") REFERENCES "CatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

