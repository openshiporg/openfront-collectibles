import { z } from 'zod';

// The existing built-in adapters share these shapes. Parse at their unknown
// dispatch boundary; never infer units or a valid address from arbitrary JSON.
export const addressSchema = z.object({
  firstName: z.string().max(200).default(''), lastName: z.string().max(200).default(''),
  company: z.string().max(200).nullish(), address1: z.string().min(1).max(500),
  address2: z.string().max(500).nullish(), city: z.string().min(1).max(200),
  province: z.string().max(200).nullish(), postalCode: z.string().min(1).max(30),
  phone: z.string().max(100).nullish(), email: z.union([z.literal(''), z.string().email()]).nullish(),
  country: z.object({ iso2: z.string().regex(/^[a-z]{2}$/i) }),
});
export const providerSchema = z.object({ id: z.string().min(1).max(200), accessToken: z.string().min(1).max(10_000) });
export const dimensionsSchema = z.object({
  length: z.number().finite().positive(), width: z.number().finite().positive(), height: z.number().finite().positive(),
  unit: z.enum(['in', 'cm', 'm', 'ft']), weight: z.number().finite().positive(),
  weightUnit: z.enum(['oz', 'lb', 'lbs', 'kg', 'g', 'mg']),
});
export const ratesInputSchema = z.object({ provider: providerSchema.extend({ fromAddress: addressSchema }), order: z.object({ shippingAddress: addressSchema }), dimensions: dimensionsSchema });
export const labelInputSchema = ratesInputSchema.extend({ rateId: z.string().min(1).max(2000), lineItems: z.array(z.unknown()).max(500).default([]), idempotencyKey: z.string().min(1).max(500) });
export const addressInputSchema = z.object({ provider: providerSchema, address: addressSchema });
export const trackingInputSchema = z.object({ provider: providerSchema, trackingNumber: z.string().min(1).max(200) });
export const cancelInputSchema = z.object({ provider: providerSchema, labelId: z.string().min(1).max(200) });
export type PackageDimensions = z.infer<typeof dimensionsSchema>;
export type ShippingProviderConfig = { id: string; accessToken: string; [field: string]: unknown };
export const rateSchema = z.object({ id: z.string().min(1), providerId: z.string().min(1), service: z.string().min(1), carrier: z.string().min(1), price: z.union([z.string().regex(/^\d+(\.\d+)?$/), z.number().finite().nonnegative()]), currency: z.string().regex(/^[A-Z]{3}$/), estimatedDays: z.number().finite().nonnegative().nullish() });
export type ShippingRate = z.infer<typeof rateSchema>;
