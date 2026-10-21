import type { AddressUpdateInput, AddressWhereUniqueInput, Context } from '.keystone/types';
import { lockOwnedAddress, runOwnedAddressCommand, sanitizeCustomerAddressInput } from '../security/address-input';

export default async function updateActiveUserAddress(_root: unknown, { where, data }: { where: AddressWhereUniqueInput; data: AddressUpdateInput }, context: Context) {
  const input = sanitizeCustomerAddressInput(data);
  return runOwnedAddressCommand(context, async (tx, ownerId) => {
    const addressId = await lockOwnedAddress(tx, ownerId, where.id);
    await tx.db.Address.updateOne({ where: { id: addressId }, data: input });
    if (input.isBilling) {
      await tx.prisma.address.updateMany({ where: { userId: ownerId, id: { not: addressId }, isBilling: true }, data: { isBilling: false, updatedAt: new Date() } });
    }
    // The declared SDL result is User, not the updated Address.
    return tx.db.User.findOne({ where: { id: ownerId } });
  });
}
