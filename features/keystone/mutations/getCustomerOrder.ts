import { projectCustomerOrderForRead } from "../lib/customer-order-projection";

const CUSTOMER_ORDER_PREFLIGHT_QUERY = `
  id
  secretKey
  user { id }
`;

const CUSTOMER_ORDER_DETAIL_QUERY = `
  id
  secretKey
  displayId
  status
  fulfillmentStatus
  fulfillmentDetails
  paymentDetails
  total
  formattedTotalPaid
  subtotal
  shipping
  discount
  tax
  createdAt
  email
  unfulfilled
  fulfillments {
    id
    createdAt
    canceledAt
    fulfillmentItems {
      id
      quantity
      lineItem {
        id
        quantity
        title
        sku
        thumbnail
        metadata
        variantTitle
        formattedUnitPrice
        formattedTotal
        productData
        variantData
      }
    }
    shippingLabels {
      id
      labelUrl
      trackingNumber
      trackingUrl
      carrier
    }
  }
  user {
    id
    name
    email
  }
  shippingAddress {
    firstName
    lastName
    company
    address1
    address2
    city
    province
    postalCode
    country {
      id
      iso2
      name
    }
    phone
  }
  billingAddress {
    firstName
    lastName
    company
    address1
    address2
    city
    province
    postalCode
    country {
      id
      iso2
      name
    }
    phone
  }
  shippingMethods {
    id
    price
    shippingOption {
      name
    }
  }
  payments {
    id
    amount
    status
    data
    createdAt
    paymentCollection {
      paymentSessions {
        id
        isSelected
        paymentProvider {
          id
          code
        }
      }
    }
  }
  lineItems {
    id
    title
    quantity
    thumbnail
    variantTitle
    formattedUnitPrice
    formattedTotal
    variantData
    productData
  }
  region {
    id
    name
    currency {
      code
    }
  }
`;

function notFound(): never {
  throw new Error("Order not found");
}

async function getCustomerOrder(
  root: unknown,
  { orderId, secretKey }: { orderId?: string | null; secretKey?: string | null },
  context: any
) {
  const ownerId = typeof context.session?.itemId === "string" && context.session.itemId
    ? context.session.itemId
    : null;
  const hasSecretKey = secretKey !== undefined && secretKey !== null;
  if (typeof orderId !== "string" || orderId.length === 0 || (hasSecretKey && typeof secretKey !== "string")) {
    return notFound();
  }
  if (!hasSecretKey && ownerId === null) return notFound();

  const sudoContext = context.sudo();
  const authorizationRecord = await sudoContext.query.Order.findOne({
    where: { id: orderId },
    query: CUSTOMER_ORDER_PREFLIGHT_QUERY,
  });
  if (!authorizationRecord) return notFound();

  const authorizedBySecret = hasSecretKey && authorizationRecord.secretKey === secretKey;
  const authorizedByOwner = !hasSecretKey && ownerId !== null && authorizationRecord.user?.id === ownerId;
  if (!authorizedBySecret && !authorizedByOwner) return notFound();

  const order = await sudoContext.query.Order.findOne({
    where: { id: orderId },
    query: CUSTOMER_ORDER_DETAIL_QUERY,
  });
  if (!order) return notFound();

  // Recheck the same capability against the hydrated row to fail closed on owner/key changes.
  const stillAuthorized = hasSecretKey
    ? order.secretKey === secretKey
    : ownerId !== null && order.user?.id === ownerId;
  if (!stillAuthorized) return notFound();

  // The secret is an authorization credential, never part of the customer response.
  const { secretKey: _secretKey, ...customerOrder } = order;
  return projectCustomerOrderForRead(customerOrder);
}

export default getCustomerOrder;
