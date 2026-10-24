import type { Context as KeystoneContext } from '.keystone/types';
import type { GraphQLResolveInfo } from 'graphql';
import { isPaymentProviderConfigured } from '../utils/paymentProviderConfig';

// Define args structure if simple
interface ActiveCartPaymentProvidersArgs {
    regionId: string;
}

async function activeCartPaymentProviders(
    root: any,
    { regionId }: ActiveCartPaymentProvidersArgs, // Typed args
    context: KeystoneContext, // Typed context
    info?: GraphQLResolveInfo // Optional info
): Promise<readonly any[]> { // Basic Promise<readonly any[]> return type
  if (!regionId) {
    throw new Error('Region ID is required');
  }

  const providers = await context.sudo().query.PaymentProvider.findMany({
    where: {
      isInstalled: { equals: true },
      regions: { some: { id: { equals: regionId } } }
    },
    query: `
      id
      name
      code
      isInstalled
    `
  });

  // Checkout only offers methods that can complete it. Manual tender (bank
  // transfer) places the order with its payment pending until a manager records it.
  return providers.filter((provider: any) => isPaymentProviderConfigured(provider.code || ''));
}

export default activeCartPaymentProviders; 