export interface ProductWhereClause {
  productCollections?: {
    some: { id: { equals: any } }
  },
  productCategories?: {
    some: { id: { equals: any } }
  },
  isGiftcard: { equals: any },
  productVariants: {
    some: {
      prices: {
        some: {
          region: {
            countries: { some: { iso2: { equals: string } } }
          }
        }
      }
    }
  },
  id?: { in: any }
}

export interface StorefrontProductCategory {
  id: string;
  title: string;
  handle: string;
  metadata?: Record<string, any>;
  isActive?: boolean;
  parent_category?: StorefrontProductCategory;
  category_children?: StorefrontProductCategory[];
}

export interface StoreCollection {
  id: string;
  title: string;
  handle: string;
  products?: any[];
}

export interface StoreRegion {
  id: string;
  name: string;
  currency_code: string;
  currency: {
    code: string;
  };
  countries: {
    id: string;
    name: string;
    iso2: string;
  }[];
  locale?: string;
}

export interface MoneyAmount {
  amount: number;
  currency: {
    code: string;
  };
  calculatedPrice: {
    calculatedAmount: number;
    originalAmount: number;
    currencyCode: string;
  };
}

export interface ProductVariant {
  id: string;
  title: string;
  sku?: string;
  inventoryQuantity?: number;
  allowBackorder?: boolean;
  metadata?: Record<string, any>;
  productOptionValues?: {
    id: string;
    value: string;
    productOption: {
      id: string;
    };
  }[];
  prices?: MoneyAmount[];
}

export interface StorefrontAddress {
  id: string; firstName?: string | null; lastName?: string | null;
  company?: string | null; address1?: string | null; address2?: string | null;
  city?: string | null; province?: string | null; postalCode?: string | null;
  phone?: string | null; isBilling?: boolean;
  user?: { id: string } | null;
  country?: { id: string; name: string; iso2: string } | null;
}
export type Address = StorefrontAddress;
export interface StorefrontCustomerProfile {
  id: string; name?: string; email: string; firstName?: string | null;
  lastName?: string | null; phone?: string | null; tokenGeneratedAt?: string | null;
  billingAddress?: StorefrontAddress | null; addresses?: StorefrontAddress[];
}
export type StorefrontAccountCustomer = StorefrontCustomerProfile;
export type StorefrontRegion = StoreRegion;
export type StorefrontRegionBasic = Pick<StoreRegion, 'id' | 'name' | 'countries' | 'currency'>;
export type StorefrontCollection = StoreCollection;
export interface CreateCustomerData { email: string; password: string; firstName: string; lastName: string; phone?: string }
export interface UpdateCustomerData { email?: string; password?: string; firstName?: string; lastName?: string; phone?: string }
export interface AddShippingAddressData {
  firstName: string; lastName: string; company?: string; address1: string;
  address2?: string; city: string; province?: string; postalCode: string;
  countryCode: string; phone?: string;
}
export type UpdateShippingAddressData = AddShippingAddressData;
export interface StoreOrder {
  id: string; displayId: number; createdAt: string; status: string; email?: string | null;
  total: string; subtotal: string; shipping: string; discount: string; tax: string;
  giftCard?: string | null; formattedTotalPaid?: string;
  region: Pick<StoreRegion, 'id' | 'name' | 'currency'>;
  shippingAddress?: Omit<StorefrontAddress, 'id'> | null;
  billingAddress?: Omit<StorefrontAddress, 'id'> | null;
  shippingMethods?: { id: string; shippingOption?: { name: string } | null }[];
  lineItems: import('@/features/keystone/lib/order-view-projection').OrderLineView[];
  unfulfilled?: { id: string; quantity: number }[];
  fulfillments?: {
    id: string; createdAt: string; canceledAt?: string | null;
    fulfillmentItems?: { id: string; quantity: number; lineItem: import('@/features/keystone/lib/order-view-projection').OrderLineView }[];
    shippingLabels?: { id: string; carrier?: string | null; trackingNumber?: string | null; trackingUrl?: string | null; labelUrl?: string | null }[];
  }[];
  payments?: {
    id: string; createdAt: string; status: string; data?: { cardLast4?: string; manual?: boolean } | null;
    paymentCollection?: { paymentSessions?: { id: string; isSelected: boolean; paymentProvider?: { code: string } | null }[] } | null;
  }[];
}

export interface StorefrontOrderOverviewItem {
  id: string;
  displayId: number;
  createdAt?: string | null;
  total?: number | string | null;
  lineItemsCount?: number | null;
  lineItemsHasMore?: boolean | null;
  lineItems?: Array<{
    id: string;
    title: string;
    quantity: number;
    thumbnail?: string | null;
  }> | null;
}

export interface StoreProduct {
  id: string;
  title: string;
  handle: string;
  description?: {
    document: any;
  };
  thumbnail?: string;
  productImages?: {
    id: string;
    image: {
      url: string;
    };
    imagePath: string;
  }[];
  productOptions?: {
    id: string;
    title: string;
    metadata?: Record<string, any>;
    productOptionValues?: {
      id: string;
      value: string;
    }[];
  }[];
  productVariants?: ProductVariant[];
  status?: string;
  metadata?: Record<string, any>;
}
