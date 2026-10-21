-- Root Prisma 6.10.1's implicit relation identity, based on the actual
-- fresh zero-to-head diff. Adapted from Salon's in-place index promotion.
-- Existing unique AB indexes preserve all relation rows; no rebuild or reset.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"_Cart_discounts"'::regclass AND contype = 'p') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexrelid = '"_Cart_discounts_AB_unique"'::regclass AND indisunique) THEN
      RAISE EXCEPTION 'Expected unique relation index is missing';
    END IF;
    ALTER TABLE "_Cart_discounts" ADD CONSTRAINT "_Cart_discounts_AB_pkey" PRIMARY KEY USING INDEX "_Cart_discounts_AB_unique";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"_Cart_giftCards"'::regclass AND contype = 'p') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexrelid = '"_Cart_giftCards_AB_unique"'::regclass AND indisunique) THEN
      RAISE EXCEPTION 'Expected unique relation index is missing';
    END IF;
    ALTER TABLE "_Cart_giftCards" ADD CONSTRAINT "_Cart_giftCards_AB_pkey" PRIMARY KEY USING INDEX "_Cart_giftCards_AB_unique";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"_ClaimItem_claimTags"'::regclass AND contype = 'p') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexrelid = '"_ClaimItem_claimTags_AB_unique"'::regclass AND indisunique) THEN
      RAISE EXCEPTION 'Expected unique relation index is missing';
    END IF;
    ALTER TABLE "_ClaimItem_claimTags" ADD CONSTRAINT "_ClaimItem_claimTags_AB_pkey" PRIMARY KEY USING INDEX "_ClaimItem_claimTags_AB_unique";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"_Currency_stores"'::regclass AND contype = 'p') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexrelid = '"_Currency_stores_AB_unique"'::regclass AND indisunique) THEN
      RAISE EXCEPTION 'Expected unique relation index is missing';
    END IF;
    ALTER TABLE "_Currency_stores" ADD CONSTRAINT "_Currency_stores_AB_pkey" PRIMARY KEY USING INDEX "_Currency_stores_AB_unique";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"_CustomerGroup_discountConditions"'::regclass AND contype = 'p') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexrelid = '"_CustomerGroup_discountConditions_AB_unique"'::regclass AND indisunique) THEN
      RAISE EXCEPTION 'Expected unique relation index is missing';
    END IF;
    ALTER TABLE "_CustomerGroup_discountConditions" ADD CONSTRAINT "_CustomerGroup_discountConditions_AB_pkey" PRIMARY KEY USING INDEX "_CustomerGroup_discountConditions_AB_unique";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"_CustomerGroup_priceLists"'::regclass AND contype = 'p') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexrelid = '"_CustomerGroup_priceLists_AB_unique"'::regclass AND indisunique) THEN
      RAISE EXCEPTION 'Expected unique relation index is missing';
    END IF;
    ALTER TABLE "_CustomerGroup_priceLists" ADD CONSTRAINT "_CustomerGroup_priceLists_AB_pkey" PRIMARY KEY USING INDEX "_CustomerGroup_priceLists_AB_unique";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"_CustomerGroup_users"'::regclass AND contype = 'p') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexrelid = '"_CustomerGroup_users_AB_unique"'::regclass AND indisunique) THEN
      RAISE EXCEPTION 'Expected unique relation index is missing';
    END IF;
    ALTER TABLE "_CustomerGroup_users" ADD CONSTRAINT "_CustomerGroup_users_AB_pkey" PRIMARY KEY USING INDEX "_CustomerGroup_users_AB_unique";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"_DiscountCondition_productCategories"'::regclass AND contype = 'p') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexrelid = '"_DiscountCondition_productCategories_AB_unique"'::regclass AND indisunique) THEN
      RAISE EXCEPTION 'Expected unique relation index is missing';
    END IF;
    ALTER TABLE "_DiscountCondition_productCategories" ADD CONSTRAINT "_DiscountCondition_productCategories_AB_pkey" PRIMARY KEY USING INDEX "_DiscountCondition_productCategories_AB_unique";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"_DiscountCondition_productCollections"'::regclass AND contype = 'p') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexrelid = '"_DiscountCondition_productCollections_AB_unique"'::regclass AND indisunique) THEN
      RAISE EXCEPTION 'Expected unique relation index is missing';
    END IF;
    ALTER TABLE "_DiscountCondition_productCollections" ADD CONSTRAINT "_DiscountCondition_productCollections_AB_pkey" PRIMARY KEY USING INDEX "_DiscountCondition_productCollections_AB_unique";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"_DiscountCondition_productTags"'::regclass AND contype = 'p') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexrelid = '"_DiscountCondition_productTags_AB_unique"'::regclass AND indisunique) THEN
      RAISE EXCEPTION 'Expected unique relation index is missing';
    END IF;
    ALTER TABLE "_DiscountCondition_productTags" ADD CONSTRAINT "_DiscountCondition_productTags_AB_pkey" PRIMARY KEY USING INDEX "_DiscountCondition_productTags_AB_unique";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"_DiscountCondition_productTypes"'::regclass AND contype = 'p') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexrelid = '"_DiscountCondition_productTypes_AB_unique"'::regclass AND indisunique) THEN
      RAISE EXCEPTION 'Expected unique relation index is missing';
    END IF;
    ALTER TABLE "_DiscountCondition_productTypes" ADD CONSTRAINT "_DiscountCondition_productTypes_AB_pkey" PRIMARY KEY USING INDEX "_DiscountCondition_productTypes_AB_unique";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"_DiscountCondition_products"'::regclass AND contype = 'p') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexrelid = '"_DiscountCondition_products_AB_unique"'::regclass AND indisunique) THEN
      RAISE EXCEPTION 'Expected unique relation index is missing';
    END IF;
    ALTER TABLE "_DiscountCondition_products" ADD CONSTRAINT "_DiscountCondition_products_AB_pkey" PRIMARY KEY USING INDEX "_DiscountCondition_products_AB_unique";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"_DiscountRule_products"'::regclass AND contype = 'p') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexrelid = '"_DiscountRule_products_AB_unique"'::regclass AND indisunique) THEN
      RAISE EXCEPTION 'Expected unique relation index is missing';
    END IF;
    ALTER TABLE "_DiscountRule_products" ADD CONSTRAINT "_DiscountRule_products_AB_pkey" PRIMARY KEY USING INDEX "_DiscountRule_products_AB_unique";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"_Discount_orders"'::regclass AND contype = 'p') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexrelid = '"_Discount_orders_AB_unique"'::regclass AND indisunique) THEN
      RAISE EXCEPTION 'Expected unique relation index is missing';
    END IF;
    ALTER TABLE "_Discount_orders" ADD CONSTRAINT "_Discount_orders_AB_pkey" PRIMARY KEY USING INDEX "_Discount_orders_AB_unique";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"_Discount_regions"'::regclass AND contype = 'p') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexrelid = '"_Discount_regions_AB_unique"'::regclass AND indisunique) THEN
      RAISE EXCEPTION 'Expected unique relation index is missing';
    END IF;
    ALTER TABLE "_Discount_regions" ADD CONSTRAINT "_Discount_regions_AB_pkey" PRIMARY KEY USING INDEX "_Discount_regions_AB_unique";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"_FulfillmentProvider_regions"'::regclass AND contype = 'p') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexrelid = '"_FulfillmentProvider_regions_AB_unique"'::regclass AND indisunique) THEN
      RAISE EXCEPTION 'Expected unique relation index is missing';
    END IF;
    ALTER TABLE "_FulfillmentProvider_regions" ADD CONSTRAINT "_FulfillmentProvider_regions_AB_pkey" PRIMARY KEY USING INDEX "_FulfillmentProvider_regions_AB_unique";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"_MoneyAmount_priceRules"'::regclass AND contype = 'p') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexrelid = '"_MoneyAmount_priceRules_AB_unique"'::regclass AND indisunique) THEN
      RAISE EXCEPTION 'Expected unique relation index is missing';
    END IF;
    ALTER TABLE "_MoneyAmount_priceRules" ADD CONSTRAINT "_MoneyAmount_priceRules_AB_pkey" PRIMARY KEY USING INDEX "_MoneyAmount_priceRules_AB_unique";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"_Notification_otherNotifications"'::regclass AND contype = 'p') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexrelid = '"_Notification_otherNotifications_AB_unique"'::regclass AND indisunique) THEN
      RAISE EXCEPTION 'Expected unique relation index is missing';
    END IF;
    ALTER TABLE "_Notification_otherNotifications" ADD CONSTRAINT "_Notification_otherNotifications_AB_pkey" PRIMARY KEY USING INDEX "_Notification_otherNotifications_AB_unique";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"_PaymentProvider_regions"'::regclass AND contype = 'p') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexrelid = '"_PaymentProvider_regions_AB_unique"'::regclass AND indisunique) THEN
      RAISE EXCEPTION 'Expected unique relation index is missing';
    END IF;
    ALTER TABLE "_PaymentProvider_regions" ADD CONSTRAINT "_PaymentProvider_regions_AB_pkey" PRIMARY KEY USING INDEX "_PaymentProvider_regions_AB_unique";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"_PriceSet_ruleTypes"'::regclass AND contype = 'p') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexrelid = '"_PriceSet_ruleTypes_AB_unique"'::regclass AND indisunique) THEN
      RAISE EXCEPTION 'Expected unique relation index is missing';
    END IF;
    ALTER TABLE "_PriceSet_ruleTypes" ADD CONSTRAINT "_PriceSet_ruleTypes_AB_pkey" PRIMARY KEY USING INDEX "_PriceSet_ruleTypes_AB_unique";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"_ProductOptionValue_productVariants"'::regclass AND contype = 'p') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexrelid = '"_ProductOptionValue_productVariants_AB_unique"'::regclass AND indisunique) THEN
      RAISE EXCEPTION 'Expected unique relation index is missing';
    END IF;
    ALTER TABLE "_ProductOptionValue_productVariants" ADD CONSTRAINT "_ProductOptionValue_productVariants_AB_pkey" PRIMARY KEY USING INDEX "_ProductOptionValue_productVariants_AB_unique";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"_ProductType_taxRates"'::regclass AND contype = 'p') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexrelid = '"_ProductType_taxRates_AB_unique"'::regclass AND indisunique) THEN
      RAISE EXCEPTION 'Expected unique relation index is missing';
    END IF;
    ALTER TABLE "_ProductType_taxRates" ADD CONSTRAINT "_ProductType_taxRates_AB_pkey" PRIMARY KEY USING INDEX "_ProductType_taxRates_AB_unique";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"_Product_productCategories"'::regclass AND contype = 'p') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexrelid = '"_Product_productCategories_AB_unique"'::regclass AND indisunique) THEN
      RAISE EXCEPTION 'Expected unique relation index is missing';
    END IF;
    ALTER TABLE "_Product_productCategories" ADD CONSTRAINT "_Product_productCategories_AB_pkey" PRIMARY KEY USING INDEX "_Product_productCategories_AB_unique";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"_Product_productCollections"'::regclass AND contype = 'p') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexrelid = '"_Product_productCollections_AB_unique"'::regclass AND indisunique) THEN
      RAISE EXCEPTION 'Expected unique relation index is missing';
    END IF;
    ALTER TABLE "_Product_productCollections" ADD CONSTRAINT "_Product_productCollections_AB_pkey" PRIMARY KEY USING INDEX "_Product_productCollections_AB_unique";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"_Product_productImages"'::regclass AND contype = 'p') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexrelid = '"_Product_productImages_AB_unique"'::regclass AND indisunique) THEN
      RAISE EXCEPTION 'Expected unique relation index is missing';
    END IF;
    ALTER TABLE "_Product_productImages" ADD CONSTRAINT "_Product_productImages_AB_pkey" PRIMARY KEY USING INDEX "_Product_productImages_AB_unique";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"_Product_productTags"'::regclass AND contype = 'p') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexrelid = '"_Product_productTags_AB_unique"'::regclass AND indisunique) THEN
      RAISE EXCEPTION 'Expected unique relation index is missing';
    END IF;
    ALTER TABLE "_Product_productTags" ADD CONSTRAINT "_Product_productTags_AB_pkey" PRIMARY KEY USING INDEX "_Product_productTags_AB_unique";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"_Product_taxRates"'::regclass AND contype = 'p') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexrelid = '"_Product_taxRates_AB_unique"'::regclass AND indisunique) THEN
      RAISE EXCEPTION 'Expected unique relation index is missing';
    END IF;
    ALTER TABLE "_Product_taxRates" ADD CONSTRAINT "_Product_taxRates_AB_pkey" PRIMARY KEY USING INDEX "_Product_taxRates_AB_unique";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"_Region_shippingProviders"'::regclass AND contype = 'p') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexrelid = '"_Region_shippingProviders_AB_unique"'::regclass AND indisunique) THEN
      RAISE EXCEPTION 'Expected unique relation index is missing';
    END IF;
    ALTER TABLE "_Region_shippingProviders" ADD CONSTRAINT "_Region_shippingProviders_AB_pkey" PRIMARY KEY USING INDEX "_Region_shippingProviders_AB_unique";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"_ShippingOption_taxRates"'::regclass AND contype = 'p') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_index WHERE indexrelid = '"_ShippingOption_taxRates_AB_unique"'::regclass AND indisunique) THEN
      RAISE EXCEPTION 'Expected unique relation index is missing';
    END IF;
    ALTER TABLE "_ShippingOption_taxRates" ADD CONSTRAINT "_ShippingOption_taxRates_AB_pkey" PRIMARY KEY USING INDEX "_ShippingOption_taxRates_AB_unique";
  END IF;
END $$;
