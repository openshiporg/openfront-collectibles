import { denyAll } from '@keystone-6/core/access';
import { permissions } from '../access';
import { isMachinePrincipal } from './principal';

type AccessArgs = Parameters<typeof permissions.canManageRoles>[0];

export const controlPlaneAccess = {
  passwordUpdate: denyAll,
  emailUpdate: permissions.canManageRoles,
  keySecretUpdate: denyAll,
  keyOwnerUpdate: denyAll,
  userDeletionScope(args: AccessArgs) {
    return permissions.canManageRoles(args) ? true : permissions.canManageUsers(args) ? { role: null } : false;
  },
  keyOwnerCreate({ session, inputData }: AccessArgs & { inputData: Record<string, unknown> }) {
    if (!session?.itemId || isMachinePrincipal(session)) return false;
    if (permissions.canManageRoles({ session })) return true;
    if (!inputData.user) return true;
    const relation = inputData.user;
    if (typeof relation !== 'object' || relation === null || !('connect' in relation)) return false;
    const connect = relation.connect;
    return typeof connect === 'object' && connect !== null && 'id' in connect && connect.id === session.itemId;
  },
};
