import type { AddressWhereUniqueInput, Context } from '.keystone/types';
import { lockOwnedAddress, runOwnedAddressCommand } from '../security/address-input';

export default async function deleteActiveUserAddress(_root: unknown, { where }: { where: AddressWhereUniqueInput }, context: Context) {
  return runOwnedAddressCommand(context, async (tx, ownerId) => {
    const addressId = await lockOwnedAddress(tx, ownerId, where.id);
    return tx.db.Address.deleteOne({ where: { id: addressId } });
  });
}
