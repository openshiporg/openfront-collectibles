"use server";

import { z } from 'zod';
import { rateSchema, type ShippingRate, type ShippingProviderConfig } from '../../integrations/shipping/contracts';
import { shippingProviderAdapters } from '../../integrations/shipping';

// Define types for the shipping provider and function parameters
type ShippingProvider = ShippingProviderConfig;

type AdapterFunctionParams = {
  provider: Record<string, unknown>;
  functionName: string;
  args: Record<string, unknown>;
};

/**
 * Executes a shipping provider adapter function
 * @param params - Parameters including provider, function name, and arguments
 * @returns The result from the adapter function
 */
export async function executeAdapterFunction({
  provider,
  functionName,
  args
}: AdapterFunctionParams): Promise<unknown> {
  const adapterKey = provider?.[functionName];
  if (typeof adapterKey === 'string' && adapterKey.startsWith('http')) {
    const response = await fetch(adapterKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, ...args }),
    });
    if (!response.ok) {
      throw new Error(`HTTP request failed: ${response.statusText}`);
    }
    return response.json();
  }
  if (typeof adapterKey !== 'string' || !Object.prototype.hasOwnProperty.call(shippingProviderAdapters, adapterKey)) {
    throw new Error('Shipping provider adapter is not registered');
  }

  const adapter = await shippingProviderAdapters[adapterKey as keyof typeof shippingProviderAdapters]();
  const fn = adapter[functionName as keyof typeof adapter];
  if (typeof fn !== 'function') throw new Error('Shipping provider operation is not registered');

  try {
    const operation = fn as unknown as (input: Record<string, unknown>) => Promise<unknown>;
    return await operation({ provider, ...args });
  } catch (error) {
    throw new Error(
      `Error executing ${functionName} for provider ${adapterKey}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// Define types for common function parameters
type Order = Record<string, unknown>;
type Dimensions = Record<string, unknown>;
type Address = unknown;
type LineItem = Record<string, unknown>;

type CreateLabelParams = {
  provider: ShippingProvider;
  order: Order;
  rateId: string;
  dimensions: Dimensions;
  lineItems: LineItem[];
  idempotencyKey?: string;
};

type GetRatesParams = {
  provider: ShippingProvider;
  order: Order;
  dimensions: Dimensions;
};

type ValidateAddressParams = {
  provider: ShippingProvider;
  address: Address;
};

type TrackShipmentParams = {
  provider: ShippingProvider;
  trackingNumber: string;
};

type CancelLabelParams = {
  provider: ShippingProvider;
  labelId: string;
};

// Helper functions for common operations
/**
 * Creates a shipping label
 * @param params - Parameters for creating a label
 * @returns The created label information
 */
export async function createLabel({ provider, order, rateId, dimensions, lineItems, idempotencyKey }: CreateLabelParams): Promise<any> {
  return executeAdapterFunction({
    provider,
    functionName: "createLabelFunction",
    args: { order, rateId, dimensions, lineItems, idempotencyKey },
  });
}

/**
 * Gets shipping rates
 * @param params - Parameters for getting rates
 * @returns Available shipping rates
 */
export async function getRates({ provider, order, dimensions }: GetRatesParams): Promise<ShippingRate[]> {
  const result = await executeAdapterFunction({
    provider,
    functionName: "getRatesFunction",
    args: { order, dimensions },
  });
  return z.array(rateSchema).max(1000).parse(result);
}

/**
 * Validates a shipping address
 * @param params - Parameters for validating an address
 * @returns Address validation results
 */
export async function validateAddress({ provider, address }: ValidateAddressParams): Promise<unknown> {
  return executeAdapterFunction({
    provider,
    functionName: "validateAddressFunction",
    args: { address },
  });
}

/**
 * Tracks a shipment
 * @param params - Parameters for tracking a shipment
 * @returns Tracking information
 */
export async function trackShipment({ provider, trackingNumber }: TrackShipmentParams): Promise<unknown> {
  return executeAdapterFunction({
    provider,
    functionName: "trackShipmentFunction",
    args: { trackingNumber },
  });
}

/**
 * Cancels a shipping label
 * @param params - Parameters for canceling a label
 * @returns Cancellation results
 */
export async function cancelLabel({ provider, labelId }: CancelLabelParams): Promise<unknown> {
  return executeAdapterFunction({
    provider,
    functionName: "cancelLabelFunction",
    args: { labelId },
  });
}
