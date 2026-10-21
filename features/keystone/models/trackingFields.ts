import { timestamp } from '@keystone-6/core/fields';
import type { BaseListTypeInfo, FieldData } from '@keystone-6/core/types';

// Polymorphic field factories retain each generated List's access/hook types.
// They carry no business-specific inputs and never grant writes to callers.
export const trackingFields = {
  createdAt: <T extends BaseListTypeInfo>(data: FieldData) => timestamp<T>({
    access: { read: () => true, create: () => false, update: () => false },
    validation: { isRequired: true },
    defaultValue: { kind: 'now' },
    ui: { createView: { fieldMode: 'hidden' }, itemView: { fieldMode: 'read' } },
  })(data),
  updatedAt: <T extends BaseListTypeInfo>(data: FieldData) => timestamp<T>({
    access: { read: () => true, create: () => false, update: () => false },
    db: { updatedAt: true },
    validation: { isRequired: true },
    defaultValue: { kind: 'now' },
    ui: { createView: { fieldMode: 'hidden' }, itemView: { fieldMode: 'read' } },
  })(data),
};
