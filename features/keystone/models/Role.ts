
import { relationship, text } from '@keystone-6/core/fields';
import { list } from '@keystone-6/core';
import { isSignedIn, permissions, rules } from '../access';
import { permissionFields } from './fields';
import { trackingFields } from './trackingFields';
import { allowAll, denyAll } from '@keystone-6/core/access';

export const Role = list({
  access: {
    operation: {
      query: isSignedIn,
      create: permissions.canManageRoles,
      update: permissions.canManageRoles,
      delete: permissions.canManageRoles,
    },
    filter: {
      // Staff without canReadRoles/canManageRoles can read only their own Role,
      // which the dashboard shell needs for canAccessDashboard.
      query: rules.canReadRoles,
    },
  },
  ui: {
    hideCreate: args => !permissions.canManageRoles(args),
    hideDelete: args => !permissions.canManageRoles(args),
    isHidden: args => !permissions.canManageRoles(args),
  },
  fields: {
    name: text({ validation: { isRequired: true } }),
    ...permissionFields,
    assignedTo: relationship({
      ref: 'User.role', // TODO: Add this to the User
      many: true,
      // ui: {
      //   itemView: { fieldMode: 'read' },
      // },
    }),
    ...trackingFields
  },
});
