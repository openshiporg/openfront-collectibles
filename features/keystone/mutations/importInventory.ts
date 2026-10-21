import type { Context } from '.keystone/types';
import { permissions } from '../access';

// The published operation has no file input. Never enqueue an empty job or
// return a BatchJob object as Boolean and report an import that did not run.
export default async function importInventory(_root: unknown, _args: unknown, context: Context): Promise<boolean> {
  if (!permissions.canManageInventory({ session: context.session })) throw new Error('Not authorized');
  throw new Error('Inventory import requires a reviewed file workflow');
}
