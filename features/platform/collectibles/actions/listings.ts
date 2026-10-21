'use server';
import { z } from 'zod';
import { keystoneClient } from '@/features/dashboard/lib/keystoneClient';
const unit = z.object({ id: z.string(), sku: z.string(), status: z.string(), version: z.number().int(), currencyCode: z.string() });
const listing = z.object({ id: z.string(), title: z.string(), slug: z.string(), status: z.string(), format: z.string(), priceMinor: z.number().int().nullable(), currencyCode: z.string(), publicSummary: z.string(), inventoryUnit: unit.nullable() });
const projection = z.object({ listings: z.array(listing).max(100), inventoryUnits: z.array(unit).max(100) });
export type ManagedListingData = z.infer<typeof projection>;
export async function getManagedListingData() {
  const response = await keystoneClient(`query ListingWorkbench {
    listings(take: 100, orderBy: [{ createdAt: desc }]) { id title slug status format priceMinor currencyCode publicSummary inventoryUnit { id sku status version currencyCode } }
    inventoryUnits(take: 100, orderBy: [{ createdAt: desc }]) { id sku status version currencyCode }
  }`);
  if (!response.success) return { success: false as const, error: 'Listing data unavailable' };
  const parsed = projection.safeParse(response.data);
  return parsed.success ? { success: true as const, data: parsed.data } : { success: false as const, error: 'Listing data unavailable' };
}
export async function runManagedListingCommand(input: unknown) {
  const response = await keystoneClient('mutation ManageListing($input: JSON!) { manageCollectibleListing(input: $input) }', { input });
  return response.success ? { success: true as const } : { success: false as const, error: 'Listing command rejected. Reload and check stock, state, and permissions.' };
}
