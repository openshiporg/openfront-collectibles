import type * as Generated from '.keystone/types';
async function activeCartRegion(root: unknown, { countryCode }: { countryCode: string }, context: Generated.Context) {
  const sudoContext = context.sudo();

  // Find region by country code
  const regions = await sudoContext.query.Region.findMany({
    where: { 
      countries: { 
        some: { 
          iso2: { equals: countryCode } 
        } 
      } 
    },
    query: `
      id
      name
      currency {
        code
        noDivisionCurrency
      }
      countries {
        id
        name
        iso2
      }
      paymentProviders {
        id
        code
        isInstalled
      }
      shippingOptions {
        id
        name
        amount
        priceType
      }
    `
  });

  return regions[0] || null;
}

export default activeCartRegion; 