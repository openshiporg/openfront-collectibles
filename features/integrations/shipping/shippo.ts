import { z } from 'zod';
import { ratesInputSchema, labelInputSchema, addressInputSchema, trackingInputSchema, cancelInputSchema, providerSchema, type PackageDimensions } from './contracts';

const SHIPPO_API_URL = "https://api.goshippo.com";

export async function createLabelFunction(input: unknown) {
  const { provider, order, rateId, dimensions, lineItems, idempotencyKey } = labelInputSchema.parse(input);
  if (!dimensions) {
    throw new Error("Dimensions are required to create a shipping label");
  }

  if (
    !dimensions.length ||
    !dimensions.width ||
    !dimensions.height ||
    !dimensions.weight
  ) {
    throw new Error(
      "Invalid dimensions provided. All dimensions and weight are required"
    );
  }

  // Create address object first
  const addressToResponse = await fetch(`${SHIPPO_API_URL}/addresses/`, {
    method: "POST",
    headers: {
      Authorization: `ShippoToken ${provider.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
      company: order.shippingAddress.company,
      street1: order.shippingAddress.address1,
      street2: order.shippingAddress.address2,
      city: order.shippingAddress.city,
      state: order.shippingAddress.province,
      zip: order.shippingAddress.postalCode,
      country: order.shippingAddress.country.iso2,
      phone: order.shippingAddress.phone,
      email: order.shippingAddress.email,
    }),
  });

  const addressTo = await addressToResponse.json();
  if (!addressToResponse.ok) {
    throw new Error(addressTo.message || "Failed to create address");
  }

  // Create shipment
  const shipmentResponse = await fetch(`${SHIPPO_API_URL}/shipments/`, {
    method: "POST",
    headers: {
      Authorization: `ShippoToken ${provider.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      address_from: {
        name: `${provider.fromAddress.firstName} ${provider.fromAddress.lastName}`,
        company: provider.fromAddress.company,
        street1: provider.fromAddress.address1,
        street2: provider.fromAddress.address2,
        city: provider.fromAddress.city,
        state: provider.fromAddress.province,
        zip: provider.fromAddress.postalCode,
        country: provider.fromAddress.country.iso2,
        phone: provider.fromAddress.phone,
      },
      address_to: addressTo.object_id,
      parcels: [
        {
          length: dimensions.length,
          width: dimensions.width,
          height: dimensions.height,
          distance_unit: dimensions.unit,
          weight: dimensions.weight,
          mass_unit: dimensions.weightUnit || dimensions.unit,
        },
      ],
      async: false,
    }),
  });

  const shipment = await shipmentResponse.json();
  if (!shipmentResponse.ok) {
    throw new Error(shipment.message || "Failed to create shipment");
  }

  // Create transaction (label) with the specific rate
  const transactionResponse = await fetch(`${SHIPPO_API_URL}/transactions/`, {
    method: "POST",
    headers: {
      Authorization: `ShippoToken ${provider.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      rate: rateId,
      label_file_type: "PDF",
      async: false,
      ...(idempotencyKey ? { metadata: idempotencyKey } : {}),
    }),
  });

  const transaction = await transactionResponse.json();
  if (!transactionResponse.ok) {
    throw new Error(transaction.message || "Failed to create label");
  }

  // Check if Shippo returned an error status
  if (transaction.status === "ERROR") {
    const errorMessage =
      transaction.messages?.[0]?.text || "Label creation failed";
    throw new Error(errorMessage);
  }

  // Only return success if we actually got a label URL
  if (!transaction.label_url) {
    throw new Error("No label URL received from Shippo");
  }

  return {
    status: "purchased",
    data: transaction,
    rate: transaction.rate,
    carrier: transaction.provider,
    service: transaction.servicelevel?.name,
    trackingNumber: transaction.tracking_number,
    trackingUrl: transaction.tracking_url_provider,
    labelUrl: transaction.label_url,
  };
}

export async function getRatesFunction(input: unknown) {
  const { provider, order, dimensions } = ratesInputSchema.parse(input);
  if (!dimensions) {
    throw new Error("Dimensions are required to get shipping rates");
  }
  // Create address first
  const addressToResponse = await fetch(`${SHIPPO_API_URL}/addresses/`, {
    method: "POST",
    headers: {
      Authorization: `ShippoToken ${provider.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
      company: order.shippingAddress.company,
      street1: order.shippingAddress.address1,
      street2: order.shippingAddress.address2,
      city: order.shippingAddress.city,
      state: order.shippingAddress.province,
      zip: order.shippingAddress.postalCode,
      country: order.shippingAddress.country.iso2,
      phone: order.shippingAddress.phone,
    }),
  });

  const addressTo = await addressToResponse.json();
  if (!addressToResponse.ok) {
    throw new Error(addressTo.message || "Failed to create address");
  }

  // Create shipment to get rates
  const shipmentResponse = await fetch(`${SHIPPO_API_URL}/shipments/`, {
    method: "POST",
    headers: {
      Authorization: `ShippoToken ${provider.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      address_from: {
        name: `${provider.fromAddress.firstName} ${provider.fromAddress.lastName}`,
        company: provider.fromAddress.company,
        street1: provider.fromAddress.address1,
        street2: provider.fromAddress.address2,
        city: provider.fromAddress.city,
        state: provider.fromAddress.province,
        zip: provider.fromAddress.postalCode,
        country: provider.fromAddress.country.iso2,
        phone: provider.fromAddress.phone,
      },
      address_to: addressTo.object_id,
      parcels: [
        {
          length: dimensions.length,
          width: dimensions.width,
          height: dimensions.height,
          distance_unit: dimensions.unit,
          weight: dimensions.weight,
          mass_unit: dimensions.weightUnit,
        },
      ],
    }),
  });

  const shipment = await shipmentResponse.json();
  if (!shipmentResponse.ok) {
    throw new Error(
      shipment.message || shipment.__all__ || "Failed to create shipment"
    );
  }

  return shipment.rates.map((rawRate: unknown) => {
    const rate = z.object({ object_id: z.string(), servicelevel: z.object({ name: z.string() }), provider: z.string(), amount: z.string().regex(/^\d+(\.\d+)?$/), currency: z.string().regex(/^[A-Z]{3}$/), estimated_days: z.number().nonnegative().nullish() }).parse(rawRate);
    return ({
    id: rate.object_id,
    providerId: provider.id,
    service: rate.servicelevel.name,
    carrier: rate.provider,
    price: rate.amount,
    currency: rate.currency,
    estimatedDays: rate.estimated_days,
  }); });
}

export async function validateAddressFunction(input: unknown) {
  const { provider, address } = addressInputSchema.parse(input);
  try {
    const response = await fetch(`${SHIPPO_API_URL}/addresses/`, {
      method: "POST",
      headers: {
        Authorization: `ShippoToken ${provider.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `${address.firstName} ${address.lastName}`,
        company: address.company,
        street1: address.address1,
        street2: address.address2,
        city: address.city,
        state: address.province,
        zip: address.postalCode,
        country: address.country.iso2,
        phone: address.phone,
        validate: true,
      }),
    });

    const validation = await response.json();
    if (!response.ok) {
      throw new Error(validation.message || "Address validation failed");
    }

    return {
      isValid: validation.validation_results.is_valid,
      suggestedAddress: validation.validation_results.is_valid
        ? {
            address1: validation.street1,
            address2: validation.street2,
            city: validation.city,
            province: validation.state,
            postalCode: validation.zip,
            country: validation.country,
          }
        : null,
      errors: validation.validation_results.messages || [],
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [error instanceof Error ? error.message : 'Shipping operation failed'],
    };
  }
}

export async function trackShipmentFunction(input: unknown) {
  const { provider, trackingNumber } = trackingInputSchema.parse(input);
  const response = await fetch(`${SHIPPO_API_URL}/tracks/`, {
    method: "POST",
    headers: {
      Authorization: `ShippoToken ${provider.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      carrier: "usps",
      tracking_number: trackingNumber,
    }),
  });

  const tracking = await response.json();
  if (!response.ok) {
    throw new Error(tracking.message || "Failed to track shipment");
  }

  return {
    status: tracking.tracking_status.status,
    estimatedDelivery: tracking.eta,
    trackingUrl: tracking.tracking_url,
    events: tracking.tracking_history.map((rawEvent: unknown) => {
      const event = z.object({ status: z.string(), location: z.unknown(), status_date: z.string(), status_details: z.string() }).parse(rawEvent);
      return ({
      status: event.status,
      location: event.location,
      timestamp: event.status_date,
      message: event.status_details,
    }); }),
  };
}

export async function cancelLabelFunction(input: unknown) {
  const { provider, labelId } = cancelInputSchema.parse(input);
  try {
    const response = await fetch(`${SHIPPO_API_URL}/refunds/`, {
      method: "POST",
      headers: {
        Authorization: `ShippoToken ${provider.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transaction: labelId,
      }),
    });

    const refund = await response.json();
    if (!response.ok) {
      throw new Error(refund.message || "Failed to cancel label");
    }

    return {
      success: refund.status === "SUCCESS",
      refundStatus: typeof refund.status === "string" ? refund.status : "UNKNOWN",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Shipping operation failed',
    };
  }
}

// TODO: I need to find the correct documentation links for the remaining functions.
// Could you help me locate the correct API documentation for:
// - Getting rates
// - Address validation
// - Tracking
// - Refunds
// So I can properly cite and verify the API calls?
