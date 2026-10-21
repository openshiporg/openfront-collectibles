// UI affordances mirror backend lifecycle denials; they are not authorization.
export const immutableRecordUi = { hideDelete: true, itemView: { defaultFieldMode: 'read' as const } };
export const lockedRecordUi = { ...immutableRecordUi, hideCreate: true };
