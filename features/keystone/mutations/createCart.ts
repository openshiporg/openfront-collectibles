import type { Context } from '.keystone/types';
import createActiveCart from './createActiveCart';

// Compatibility helper delegates to the current region/session/proof boundary.
export default async function createCart(root: unknown, { regionId }: { regionId: string }, context: Context) {
  return createActiveCart(root, { regionId }, context);
}
