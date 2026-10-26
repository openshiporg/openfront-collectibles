import { GraphQLClient, gql } from 'graphql-request';
import { startOnboarding, completeOnboarding } from '../actions/onboarding';
import { SECTION_DEFINITIONS } from '../config/templates';
import { TemplateType, OnboardingStep } from './useOnboardingState';
import {
  COLLECTIBLES_LOGO_COLOR,
  COLLECTIBLES_LOGO_ICON,
} from '@/features/storefront/lib/collectibles-brand';
import { buylistOffersFromMarket } from '@/features/keystone/lib/pokemon/pricing';

const GRAPHQL_ENDPOINT = '/api/graphql';

// List and field names below are fixed in code, never caller-supplied GraphQL text.
async function existingId(client: GraphQLClient, list: 'currencies' | 'countries' | 'paymentProviders' | 'fulfillmentProviders' | 'regions' | 'shippingOptions' | 'productCategories' | 'productCollections', field: 'code' | 'iso2' | 'uniqueKey' | 'handle', value: string): Promise<string | null> {
  const result = await client.request<Record<string, { id: string }[]>>(
    `query Existing($value: String!) { ${list}(where: { ${field}: { equals: $value } }, take: 2) { id } }`, { value },
  );
  if (result[list]?.length > 1) throw new Error('Ambiguous setup identity');
  return result[list]?.[0]?.id || null;
}

interface OnboardingApiProps {
  selectedTemplate: TemplateType;
  currentJsonData: any;
  completedItems: Record<string, string[]>;
  setProgress: (message: string) => void;
  setItemLoading: (type: string, item: string) => void;
  setItemCompleted: (type: string, item: string) => void;
  setItemError: (type: string, item: string, errorMessage: string) => void;
  setStep: (step: OnboardingStep) => void;
  setError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  resetOnboardingState: () => void;
}

export function useOnboardingApi({
  selectedTemplate,
  currentJsonData,
  completedItems,
  setProgress,
  setItemLoading,
  setItemCompleted,
  setItemError,
  setStep,
  setError,
  setIsLoading,
  resetOnboardingState,
}: OnboardingApiProps) {

  const runOnboarding = async () => {
    setIsLoading(true);
    setError(null);
    resetOnboardingState();
    setStep('progress');
    setProgress('Starting onboarding...');

    // Mark onboarding as started
    try {
      await startOnboarding();
    } catch (error) {
      console.error('Error marking onboarding as started:', error);
    }

    try {
      const client = new GraphQLClient(GRAPHQL_ENDPOINT, {
        headers: { 'Content-Type': 'application/json' },
      });

      await createStore(client, currentJsonData);
      const createdCurrencies = await createCurrencies(client, currentJsonData);
      const createdCountries = await createCountries(client, currentJsonData);
      const createdPaymentProviders = await createPaymentProviders(client, currentJsonData);
      const createdFulfillmentProviders = await createFulfillmentProvider(client);
      const createdRegions = await createRegions(client, currentJsonData, createdCurrencies, createdPaymentProviders, createdFulfillmentProviders, createdCountries);
      await createShippingOptions(client, currentJsonData, createdFulfillmentProviders, createdRegions);
      const createdCategories = await createCategories(client, currentJsonData);
      const createdCollections = await createCollections(client, currentJsonData);
      await createCardSets(client, currentJsonData);
      await createProducts(client, currentJsonData, createdCategories, createdCollections, createdCurrencies, createdRegions);
      await createCollectibles(client, currentJsonData);
      await createPricing(client, currentJsonData);

      setProgress('Onboarding complete!');

      // Mark onboarding as completed
      try {
        await completeOnboarding();
      } catch (error) {
        console.error('Error marking onboarding as completed:', error);
      }

      setStep('done');
    } catch (e: any) {
      handleOnboardingError(e);
    } finally {
      setIsLoading(false);
    }
  };

  const createStore = async (client: GraphQLClient, data: any) => {
    setProgress('Creating store...');

    // Merge seed data over the defaults so normal onboarding receives its
    // logo and hue even when seed.json already defines a store object.
    const storeData = {
      name: 'Impossible Tees',
      defaultCurrencyCode: 'usd',
      homepageTitle: 'Modern Apparel Store',
      homepageDescription: 'Quality clothing and unique designs.',
      logoIcon: COLLECTIBLES_LOGO_ICON,
      logoColor: COLLECTIBLES_LOGO_COLOR,
      ...(data.store || {}),
    };

    // Set the store as loading
    setItemLoading('store', storeData.name);

    const existing = await client.request<{ stores: { id: string; name: string }[] }>(gql`query { stores(take: 2) { id name } }`);
    if (existing.stores.length) {
      // Openfront runs one store; reuse it rather than creating a second.
      setItemCompleted('store', storeData.name);
      return existing.stores[0].id;
    }
    let createdStoreId = '';
    try {
      const storeMutation = gql`
        mutation CreateStore($data: StoreCreateInput!) {
          createStore(data: $data) {
            id
            name
          }
        }
      `;

      const storeResult = (await client.request(storeMutation, {
        data: storeData,
      })) as { createStore: { id: string } };
      createdStoreId = storeResult.createStore.id;

      // Mark store as completed
      setItemCompleted('store', storeData.name);
      return createdStoreId;
    } catch (error: any) {
      console.error('Error creating store:', error);
      throw error;
    }
  };

  const createCurrencies = async (client: GraphQLClient, data: any) => {
    setProgress('Creating currencies...');
    const createdCurrencies: Record<string, string> = {};

    for (const region of data.regions) {
      const existing = await existingId(client, 'currencies', 'code', region.currencyCode);
      if (existing) { createdCurrencies[region.currencyCode] = existing; continue; }
      // Set the specific region as loading
      const regionName = `${region.name || 'Unknown'} (${(region.currencyCode || 'USD').toUpperCase()})`;
      setItemLoading('regions', regionName);

      try {
        const mutation = gql`
          mutation CreateCurrency($data: CurrencyCreateInput!) {
            createCurrency(data: $data) {
              id
              code
            }
          }
        `;
        const result = (await client.request(mutation, {
          data: {
            code: region.currencyCode,
            symbol: region.currencySymbol,
            symbolNative: region.currencySymbol,
            name: region.currencyName,
          },
        })) as { createCurrency: { id: string } };
        createdCurrencies[region.currencyCode] = result.createCurrency.id;

        // Mark the region as completed after its currency is created
        setItemCompleted('regions', regionName);
      } catch (itemError: any) {
        // Format the error message
        let itemErrorMessage = itemError.message || 'Unknown error';
        if (itemError.response?.errors) {
          itemErrorMessage = itemError.response.errors
            .map((err: any) => err.message || JSON.stringify(err))
            .join('\n');
        }

        // Set specific error for this item
        setItemError('regions', regionName, itemErrorMessage);

        // Continue with other items
      }
    }

    return createdCurrencies;
  };

  const createCountries = async (client: GraphQLClient, data: any) => {
    setProgress('Creating countries...');
    const createdCountries: Record<string, string> = {};

    for (const region of data.regions) {
      for (const country of region.countries) {
        const existing = await existingId(client, 'countries', 'iso2', country.iso2);
        if (existing) { createdCountries[country.iso2] = existing; continue; }
        const mutation = gql`
          mutation CreateCountry($data: CountryCreateInput!) {
            createCountry(data: $data) {
              id
              iso2
            }
          }
        `;
        const result = (await client.request(mutation, {
          data: country,
        })) as { createCountry: { id: string } };
        createdCountries[country.iso2] = result.createCountry.id;
      }
    }

    return createdCountries;
  };

  const createPaymentProviders = async (client: GraphQLClient, data: any) => {
    setProgress('Creating payment providers...');
    const createdPaymentProviders: Record<string, string> = {};

    for (const provider of data.paymentProviders) {
      // Set the specific payment provider as loading
      const providerName = provider.name || 'Unknown Provider';
      setItemLoading('paymentProviders', providerName);
      const existing = await existingId(client, 'paymentProviders', 'code', provider.code);
      if (existing) { createdPaymentProviders[provider.code] = existing; setItemCompleted('paymentProviders', providerName); continue; }

      const mutation = gql`
        mutation CreatePaymentProvider($data: PaymentProviderCreateInput!) {
          createPaymentProvider(data: $data) {
            id
            code
          }
        }
      `;
      const result = (await client.request(mutation, { data: provider })) as {
        createPaymentProvider: { id: string };
      };
      createdPaymentProviders[provider.code] = result.createPaymentProvider.id;

      // Mark the payment provider as completed
      setItemCompleted('paymentProviders', providerName);
    }

    return createdPaymentProviders;
  };

  const createFulfillmentProvider = async (client: GraphQLClient) => {
    setProgress('Creating fulfillment provider...');
    const createdFulfillmentProviders: Record<string, string> = {};

    const existing = await existingId(client, 'fulfillmentProviders', 'code', 'fp_manual');
    if (existing) return { fp_manual: existing };
    const fulfillmentMutation = gql`
      mutation CreateFulfillmentProvider($data: FulfillmentProviderCreateInput!) {
        createFulfillmentProvider(data: $data) {
          id
          code
        }
      }
    `;
    const fulfillmentResult = (await client.request(fulfillmentMutation, {
      data: {
        code: 'fp_manual',
        name: 'Manual Fulfillment',
        isInstalled: true,
      },
    })) as { createFulfillmentProvider: { id: string } };
    createdFulfillmentProviders['fp_manual'] = fulfillmentResult.createFulfillmentProvider.id;

    return createdFulfillmentProviders;
  };

  const createRegions = async (
    client: GraphQLClient,
    data: any,
    createdCurrencies: Record<string, string>,
    createdPaymentProviders: Record<string, string>,
    createdFulfillmentProviders: Record<string, string>,
    createdCountries: Record<string, string>
  ) => {
    setProgress('Creating regions...');
    const createdRegions: Record<string, string> = {};

    for (const region of data.regions) {
      const existing = await existingId(client, 'regions', 'code', region.code);
      if (existing) { createdRegions[region.code] = existing; continue; }
      const filteredPaymentProviders = (region.paymentProviders?.connect || [])
        .map((p: any) => createdPaymentProviders[p.code])
        .filter(Boolean)
        .map((id: string) => ({ id }));
      const filteredFulfillmentProviders = region.fulfillmentProviders?.connect || []
        ? region.fulfillmentProviders.connect
            .map((p: any) => createdFulfillmentProviders[p.code])
            .filter(Boolean)
            .map((id: string) => ({ id }))
        : [];

      const mutation = gql`
        mutation CreateRegion($data: RegionCreateInput!) {
          createRegion(data: $data) {
            id
            code
          }
        }
      `;
      const result = (await client.request(mutation, {
        data: {
          code: region.code,
          name: region.name,
          currency: {
            connect: { id: createdCurrencies[region.currencyCode] },
          },
          taxRate: region.taxRate,
          paymentProviders: filteredPaymentProviders.length > 0
            ? { connect: filteredPaymentProviders }
            : undefined,
          fulfillmentProviders: filteredFulfillmentProviders.length > 0
            ? { connect: filteredFulfillmentProviders }
            : undefined,
          countries: {
            connect: region.countries.map((c: { iso2: string }) => ({
              id: createdCountries[c.iso2],
            })),
          },
        },
      })) as { createRegion: { id: string } };
      createdRegions[region.code] = result.createRegion.id;
    }

    return createdRegions;
  };

  const createShippingOptions = async (
    client: GraphQLClient,
    data: any,
    createdFulfillmentProviders: Record<string, string>,
    createdRegions: Record<string, string>
  ) => {
    setProgress('Creating shipping options...');

    for (const option of data.shipping_options) {
      // Set the specific shipping option as loading
      const shippingName = option.name || 'Unknown Shipping';
      setItemLoading('shipping', shippingName);

      for (const region of data.regions) {
        if (await existingId(client, 'shippingOptions', 'uniqueKey', `${option.name}-${region.code}`)) continue;
        const mutation = gql`
          mutation CreateShippingOption($data: ShippingOptionCreateInput!) {
            createShippingOption(data: $data) {
              id
            }
          }
        `;
        await client.request(mutation, {
          data: {
            name: option.name,
            priceType: option.priceType,
            amount: option.amount,
            isReturn: option.isReturn || false,
            uniqueKey: `${option.name}-${region.code}`,
            fulfillmentProvider: {
              connect: { id: createdFulfillmentProviders['fp_manual'] },
            },
            region: { connect: { id: createdRegions[region.code] } },
          },
        });
      }

      // Mark the shipping option as completed
      setItemCompleted('shipping', shippingName);
    }
  };

  const createCategories = async (client: GraphQLClient, data: any) => {
    setProgress('Creating categories...');
    const createdCategories: Record<string, string> = {};

    for (const category of data.categories) {
      // Set the specific category as loading
      const categoryName = category.title || category.name || 'Unknown Category';
      setItemLoading('categories', categoryName);
      const existing = await existingId(client, 'productCategories', 'handle', category.handle);
      if (existing) { createdCategories[category.handle] = existing; setItemCompleted('categories', categoryName); continue; }

      const mutation = gql`
        mutation CreateProductCategory($data: ProductCategoryCreateInput!) {
          createProductCategory(data: $data) {
            id
            handle
          }
        }
      `;
      const result = (await client.request(mutation, {
        data: {
          title: category.name, // map to title
          handle: category.handle,
          isActive: category.isActive,
        },
      })) as { createProductCategory: { id: string } };
      createdCategories[category.handle] = result.createProductCategory.id;

      // Mark the category as completed
      setItemCompleted('categories', categoryName);
    }

    return createdCategories;
  };

  const createCollections = async (client: GraphQLClient, data: any) => {
    setProgress('Creating collections...');
    const createdCollections: Record<string, string> = {};

    for (const collection of data.collections) {
      // Set the specific collection as loading
      const collectionName = collection.title || 'Unknown Collection';
      setItemLoading('collections', collectionName);
      const existing = await existingId(client, 'productCollections', 'handle', collection.handle);
      if (existing) { createdCollections[collection.handle] = existing; setItemCompleted('collections', collectionName); continue; }

      const mutation = gql`
        mutation CreateProductCollection($data: ProductCollectionCreateInput!) {
          createProductCollection(data: $data) {
            id
            handle
          }
        }
      `;
      const result = (await client.request(mutation, {
        data: collection,
      })) as { createProductCollection: { id: string } };
      createdCollections[collection.handle] = result.createProductCollection.id;

      // Mark the collection as completed
      setItemCompleted('collections', collectionName);
    }

    return createdCollections;
  };

  const createProducts = async (
    client: GraphQLClient,
    data: any,
    createdCategories: Record<string, string>,
    createdCollections: Record<string, string>,
    createdCurrencies: Record<string, string>,
    createdRegions: Record<string, string>
  ) => {
    setProgress('Creating products and variants...');

    for (const product of data.products) {
      // Set the specific product as loading
      const productName = product.title || 'Unknown Product';
      setItemLoading('products', productName);

      const { variants, productCollections, productCategories, subtitle, image, ...productInput } = product;

      // Only connect the collections that exist for this product, by id
      let collectionsToConnect: any[] = [];
      if (productCollections && productCollections.connect) {
        collectionsToConnect = productCollections.connect
          .map((c: { handle: string }) => createdCollections[c.handle])
          .filter(Boolean)
          .map((id: string) => ({ id }));
      }

      // Only connect the categories that exist for this product, by id
      let categoriesToConnect: any[] = [];
      if (productCategories && productCategories.connect) {
        categoriesToConnect = productCategories.connect
          .map((c: { handle: string }) => createdCategories[c.handle])
          .filter(Boolean)
          .map((id: string) => ({ id }));
      }

      // Remove variants and connect collections/categories by id, omit subtitle if null/empty
      const productData = {
        ...productInput,
        ...(typeof subtitle === 'string' && subtitle.trim() !== '' ? { subtitle } : {}),
        productCollections: collectionsToConnect.length > 0 ? { connect: collectionsToConnect } : undefined,
        productCategories: categoriesToConnect.length > 0 ? { connect: categoriesToConnect } : undefined,
        // Card art is linked from the Pokémon TCG API's image host, as card shops show stock.
        ...(image?.url ? { productImages: { create: [{ imagePath: image.url, altText: image.alt || productInput.title }] } } : {}),
      };

      // Create product
      const productMutation = gql`
        mutation CreateProduct($data: ProductCreateInput!) {
          createProduct(data: $data) {
            id
            productOptions {
              id
              title
              productOptionValues {
                id
                value
              }
            }
          }
        }
      `;
      const existing = await client.request<{ products: { id: string; productOptions: { id: string; title: string; productOptionValues: { id: string; value: string }[] }[] }[] }>(
        gql`query ExistingProduct($handle: String!) { products(where: { handle: { equals: $handle } }, take: 2) { id productOptions { id title productOptionValues { id value } } } }`,
        { handle: product.handle },
      );
      if (existing.products.length > 1) throw new Error('Ambiguous product identity');
      const productResult = existing.products[0] ? { createProduct: existing.products[0] } : await client.request(productMutation, { data: productData });

      // Create variants for this product
      for (const variant of variants) {
        const previous = await client.request<{ productVariants: { id: string; product: { id: string } | null }[] }>(
          gql`query ExistingVariant($sku: String!) { productVariants(where: { sku: { equals: $sku } }, take: 2) { id product { id } } }`, { sku: variant.sku },
        );
        if (previous.productVariants.length) {
          if (previous.productVariants.length !== 1 || previous.productVariants[0].product?.id !== (productResult as any).createProduct.id) throw new Error('Variant belongs to another product');
          continue;
        }
        const variantMutation = gql`
          mutation CreateProductVariant($data: ProductVariantCreateInput!) {
            createProductVariant(data: $data) {
              id
              title
            }
          }
        `;
        const allOptionValues = (productResult as any).createProduct.productOptions.flatMap(
          (opt: any) => opt.productOptionValues
        );
        const matchingIds = variant.options
          .map((opt: any) =>
            allOptionValues.find((v: any) => v.value === opt.value)?.id
          )
          .filter(Boolean)
          .map((id: string) => ({ id }));

        // Only create prices where both currency and region exist
        const validPrices = variant.prices.filter(
          (price: { currencyCode: string; regionCode: string }) =>
            createdCurrencies[price.currencyCode] && createdRegions[price.regionCode]
        );
        const prices = {
          create: validPrices.map((price: { currencyCode: string; regionCode: string; amount: number }) => ({
            amount: price.amount,
            currency: { connect: { id: createdCurrencies[price.currencyCode] } },
            region: { connect: { id: createdRegions[price.regionCode] } },
          })),
        };

        const graded = variant.stockKind === 'graded';
        await client.request(variantMutation, {
          data: {
            title: variant.title,
            sku: variant.sku,
            metadata: graded ? { specimenCode: variant.sku, serializedInventory: true } : {},
            inventoryQuantity: variant.inventoryQuantity,
            manageInventory: variant.manageInventory,
            stockKind: variant.stockKind || 'raw',
            ...(variant.cardCondition ? { cardCondition: variant.cardCondition } : {}),
            ...(variant.cardFinish ? { cardFinish: variant.cardFinish } : {}),
            cardLanguage: variant.cardLanguage || 'EN',
            pricingMode: variant.pricingMode || 'manual',
            preorder: Boolean(variant.preorder),
            ...(variant.preorderReleaseDate ? { preorderReleaseDate: variant.preorderReleaseDate } : {}),
            ...(variant.preorderLimitPerCustomer ? { preorderLimitPerCustomer: variant.preorderLimitPerCustomer } : {}),
            product: { connect: { id: (productResult as any).createProduct.id } },
            productOptionValues: { connect: matchingIds },
            prices,
          },
        });
      }

      // Mark the product as completed
      setItemCompleted('products', productName);
    }
  };

  const createCardSets = async (client: GraphQLClient, data: any) => {
    const cardSets = data.cardSets;
    if (!cardSets) return;
    setProgress('Importing card sets and market prices...');
    const run = async (label: string, input: Record<string, unknown>) => {
      setItemLoading('cardSets', label);
      await client.request(gql`mutation ImportCardCatalog($input: JSON!) { importCardCatalog(input: $input) }`, { input });
      setItemCompleted('cardSets', label);
    };
    for (const set of cardSets.sets || []) await run(set.name || set.id, { set: set.id });
    if (cardSets.upcoming) await run(cardSets.upcoming.name, { upcoming: cardSets.upcoming });
    // Sealed product joins its set's catalog; it reports under the set it belongs to.
    if (cardSets.sealed?.length) {
      await client.request(gql`mutation ImportSealed($input: JSON!) { importCardCatalog(input: $input) }`, { input: { sealed: cardSets.sealed } });
    }
  };

  const createPricing = async (client: GraphQLClient, data: any) => {
    const pricing = data.pricing;
    if (!pricing) return;
    setProgress('Setting pricing rules and the buylist...');
    for (const rule of pricing.rules || []) {
      setItemLoading('pricing', rule.name);
      const existing = await client.request<{ pricingRules: { id: string }[] }>(
        gql`query ExistingRule($name: String!) { pricingRules(where: { name: { equals: $name } }, take: 1) { id } }`, { name: rule.name },
      );
      if (!existing.pricingRules.length) {
        await client.request(gql`mutation CreatePricingRule($data: PricingRuleCreateInput!) { createPricingRule(data: $data) { id } }`, { data: rule });
      }
      setItemCompleted('pricing', rule.name);
    }
    const buylist = pricing.buylist;
    if (!buylist) return;
    setItemLoading('pricing', buylist.name);
    const existing = await client.request<{ buylists: { id: string }[] }>(
      gql`query ExistingBuylist($name: String!) { buylists(where: { name: { equals: $name } }, take: 1) { id } }`, { name: buylist.name },
    );
    if (!existing.buylists.length) {
      const { entries, ...terms } = buylist;
      await client.request(gql`mutation CreateBuylist($data: BuylistCreateInput!) { createBuylist(data: $data) { id } }`, {
        data: {
          ...terms,
          status: 'active',
          entries: {
            create: (entries || []).map((entry: any) => {
              const offers = buylistOffersFromMarket(entry.marketMinor, terms);
              return {
                catalogItem: { connect: { handle: entry.catalogItemHandle } },
                cardFinish: entry.finish,
                minimumCondition: entry.minimumCondition,
                pricingMode: 'market',
                offerAmountMinor: offers.cashMinor,
                creditOfferMinor: offers.creditMinor,
                hotlist: Boolean(entry.hotlist),
                maximumQuantity: entry.maximumQuantity,
                active: 'active',
              };
            }),
          },
        },
      });
    }
    setItemCompleted('pricing', buylist.name);
  };

  const createCollectibles = async (client: GraphQLClient, data: any) => {
    const items = data.collectibles || [];
    if (!items.length) return;
    setProgress('Receiving graded slabs into inventory...');
    const categoryNames: Record<string, string> = Object.fromEntries(
      (data.categories || []).map((category: { handle: string; name: string }) => [category.handle, category.name])
    );
    for (const item of items) {
      setItemLoading('collectibles', item.title);
      try {
        await client.request(
          gql`mutation ReceiveCollectibleItem($input: JSON!) {
            receiveCollectibleItem(input: $input)
          }`,
          { input: { ...item, categoryName: item.categoryName || categoryNames[item.category] } },
        );
        setItemCompleted('collectibles', item.title);
      } catch (itemError: any) {
        const itemErrorMessage = itemError.response?.errors
          ? itemError.response.errors.map((err: any) => err.message || JSON.stringify(err)).join('\n')
          : itemError.message || 'Unknown error';
        setItemError('collectibles', item.title, itemErrorMessage);
      }
    }
  };

  const handleOnboardingError = (e: any) => {
    // Format the error message for better readability
    let errorMessage = e.message || 'Unknown error';

    // Check if it's a GraphQL error with response data
    if (e.response?.errors) {
      // Format GraphQL errors in a more readable way
      errorMessage = e.response.errors
        .map((err: any) => {
          // Check for Prisma errors which have a specific structure
          if (err.message && err.message.includes('Prisma error')) {
            try {
              // For Prisma errors, simplify the message to just show the constraint failure
              if (err.message.includes('Unique constraint failed')) {
                return 'Unique constraint failed - this item already exists.';
              }

              // Try to extract and format the Prisma error details
              const match = err.message.match(/\{[\s\S]*\}/);
              if (match) {
                const errorObj = JSON.parse(match[0]);
                // Return a simplified error message
                return `Prisma error: ${errorObj.message || 'Unknown Prisma error'}`;
              }
            } catch (parseError) {
              // If parsing fails, just return the original message
            }
          }

          // Extract the most useful parts of the error
          if (err.message) {
            // Clean up the message by removing JSON-like structures
            return err.message.replace(/\{[\s\S]*\}/g, '[Error details omitted]');
          }

          // Last resort - stringify but limit length
          const stringified = JSON.stringify(err, null, 2);
          return stringified.length > 500
            ? stringified.substring(0, 500) + '...'
            : stringified;
        })
        .join('\n\n');
    }

    setError(errorMessage);
    console.error('Error during onboarding:', e);

    // For demonstration purposes, let's mark only the first non-completed item as failed
    const newItemErrors: Record<string, Record<string, string>> = {};

    // Find the first section with non-completed items
    for (const section of SECTION_DEFINITIONS) {
      const sectionType = section.type;
      const sectionItems = section.getItemsFn(selectedTemplate);
      const completedSectionItems = completedItems[sectionType] || [];

      // Find the first non-completed item
      const failedItem = sectionItems.find(
        (item) => !completedSectionItems.includes(item)
      );

      if (failedItem) {
        // Mark only this item as failed
        setItemError(sectionType, failedItem, errorMessage);
        // Only mark one item as failed for demonstration
        break;
      }
    }
  };

  return { runOnboarding };
}