// The inherited donor generated fictional carrier rates, labels and scans.
// Manual fulfillment is local operator work, not a carrier evidence provider.
// Preserve the finite adapter surface, but never fabricate external success.
const unavailable = () => new Error('Manual shipping has no carrier verification; record operator-attributed fulfillment separately');

export async function getRatesFunction(_input: unknown): Promise<never> { throw unavailable(); }
export async function createLabelFunction(_input: unknown): Promise<never> { throw unavailable(); }
export async function validateAddressFunction(_input: unknown): Promise<never> { throw unavailable(); }
export async function trackShipmentFunction(_input: unknown): Promise<never> { throw unavailable(); }
export async function cancelLabelFunction(_input: unknown): Promise<never> { throw unavailable(); }
