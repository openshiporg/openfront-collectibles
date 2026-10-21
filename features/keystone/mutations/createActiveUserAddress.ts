import type { AddressCreateInput, Context } from '.keystone/types';
import { runOwnedAddressCommand, sanitizeCustomerAddressInput } from '../security/address-input';

export default async function createActiveUserAddress(_root: unknown, { data }: { data: AddressCreateInput }, context: Context) {
  const input = sanitizeCustomerAddressInput(data);
  return runOwnedAddressCommand(context, async (tx, ownerId) => {
    const address = await tx.db.Address.createOne({ data: { ...input, user: { connect: { id: ownerId } } } });
    if (input.isBilling) {
      await tx.prisma.address.updateMany({ where: { userId: ownerId, id: { not: address.id }, isBilling: true }, data: { isBilling: false, updatedAt: new Date() } });
    }
    return tx.db.User.findOne({ where: { id: ownerId } });
  });
}
