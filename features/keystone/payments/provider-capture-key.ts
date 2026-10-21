export function providerCaptureKey(providerId: unknown, transactionId: unknown): string {
  if (typeof providerId !== 'string' || !providerId.trim() || providerId.length > 255 || !/^[A-Za-z0-9._:-]+$/.test(providerId.trim())) {
    throw new Error('Payment provider identity is required for capture reconciliation');
  }
  if (typeof transactionId !== 'string' || !transactionId.trim() || transactionId.length > 512 || !/^[A-Za-z0-9._:-]+$/.test(transactionId.trim())) {
    throw new Error('Provider capture identity is required for capture reconciliation');
  }
  const provider = providerId.trim();
  const transaction = transactionId.trim();
  return `v1:${provider.length}:${provider}:${transaction}`;
}
