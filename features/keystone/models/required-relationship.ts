import { relationship, type RelationshipFieldConfig } from '@keystone-6/core/fields';
import type { BaseListTypeInfo } from '@keystone-6/core/types';

// Core 6.5 does not implement relationship.validation. Preserve the intended
// required-to-one contract with supported validation, without changing SQL or
// mistaking a disconnected relationship for a valid scalar default.
export function requiredRelationship<ListTypeInfo extends BaseListTypeInfo>(
  { validation: _validation, ...config }: RelationshipFieldConfig<ListTypeInfo> & { validation: { isRequired: true } },
) {
  if (config.many) throw new Error('Required relationship helper expects one related item');
  const previous = config.hooks?.validateInput;
  return relationship<ListTypeInfo>({
    ...config,
    hooks: {
      ...config.hooks,
      async validateInput(args) {
        if (previous) await previous(args);
        const { operation, resolvedData, fieldKey, addValidationError } = args;
        const change: unknown = resolvedData[fieldKey];
        const connected = change && typeof change === 'object' && 'connect' in change && Boolean(change.connect);
        const disconnected = change === null || (change && typeof change === 'object' && 'disconnect' in change && change.disconnect === true);
        if ((operation === 'create' && !connected) || disconnected) addValidationError(`${fieldKey} is required`);
      },
    },
  });
}
