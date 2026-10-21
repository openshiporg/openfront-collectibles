interface GetProductsSortedByPriceArgs {
  countryCode: string;
  limit: number;
  offset: number;
  priceOrder: string;
  collectionId?: string;
  categoryId?: string;
}

const MAX_PAGE_SIZE = 100;
const MAX_OFFSET = 100_000;
const MAX_ID_LENGTH = 128;
const MAX_GRAPHQL_INT = 2_147_483_647;

function optionalId(value: unknown, label: string): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string' || value.length > MAX_ID_LENGTH) {
    throw new Error(`${label} is invalid`);
  }
  return value;
}

function boundedGraphQLCount(value: unknown): number {
  let count: bigint;
  if (typeof value === 'bigint') {
    count = value;
  } else if (typeof value === 'number' && Number.isSafeInteger(value)) {
    count = BigInt(value);
  } else {
    throw new Error('Product count is invalid');
  }

  if (count < BigInt(0) || count > BigInt(MAX_GRAPHQL_INT)) {
    throw new Error('Product count is outside the supported range');
  }
  return Number(count);
}

export default async function getProductsSortedByPrice(
  _root: unknown,
  args: GetProductsSortedByPriceArgs,
  context: any
) {
  const countryCode = String(args.countryCode || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode)) throw new Error('Country code is invalid');

  const limit = Number(args.limit);
  const offset = Number(args.offset);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
    throw new Error(`Limit must be an integer between 1 and ${MAX_PAGE_SIZE}`);
  }
  if (!Number.isInteger(offset) || offset < 0 || offset > MAX_OFFSET) {
    throw new Error(`Offset must be an integer between 0 and ${MAX_OFFSET}`);
  }

  const collectionId = optionalId(args.collectionId, 'Collection ID');
  const categoryId = optionalId(args.categoryId, 'Category ID');
  const orderDirection =
    args.priceOrder === 'asc' ? 'ASC' : args.priceOrder === 'desc' ? 'DESC' : undefined;
  if (!orderDirection) throw new Error('Price order is invalid');

  const prisma = context.prisma;
  const region = await prisma.region.findFirst({
    where: { countries: { some: { iso2: countryCode } } },
    select: { id: true },
  });

  if (!region) return { products: [], count: 0 };

  const conditions = [`p."status" = 'published'`, `ma."region" = $1`];
  const parameters: unknown[] = [region.id];

  if (collectionId) {
    parameters.push(collectionId);
    conditions.push(`EXISTS (
      SELECT 1 FROM "_Product_productCollections" ptpc
      WHERE ptpc."A" = p."id" AND ptpc."B" = $${parameters.length}
    )`);
  }
  if (categoryId) {
    parameters.push(categoryId);
    conditions.push(`EXISTS (
      SELECT 1 FROM "_Product_productCategories" ptpc
      WHERE ptpc."A" = p."id" AND ptpc."B" = $${parameters.length}
    )`);
  }

  const whereSql = conditions.join(' AND ');
  const rowsParameters = [...parameters, limit, offset];
  const sortedProductIds: { id: string; min_price: number }[] =
    await prisma.$queryRawUnsafe(
      `
        SELECT p."id", MIN(ma."amount") as min_price
        FROM "Product" p
        INNER JOIN "ProductVariant" pv ON pv."product" = p."id"
        INNER JOIN "MoneyAmount" ma ON ma."productVariant" = pv."id"
        WHERE ${whereSql}
        GROUP BY p."id"
        ORDER BY min_price ${orderDirection}
        LIMIT $${parameters.length + 1}
        OFFSET $${parameters.length + 2}
      `,
      ...rowsParameters,
    );

  const countRows: { count: bigint | number }[] = await prisma.$queryRawUnsafe(
    `
      SELECT COUNT(DISTINCT p."id") as count
      FROM "Product" p
      INNER JOIN "ProductVariant" pv ON pv."product" = p."id"
      INNER JOIN "MoneyAmount" ma ON ma."productVariant" = pv."id"
      WHERE ${whereSql}
    `,
    ...parameters,
  );
  const totalCount = boundedGraphQLCount(countRows[0]?.count);

  if (!sortedProductIds.length) return { products: [], count: totalCount };

  const productIds = sortedProductIds.map(({ id }) => id);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, status: 'published' },
    include: {
      productVariants: {
        include: {
          prices: {
            where: {
              region: { countries: { some: { iso2: countryCode } } },
            },
            include: { currency: true },
          },
        },
      },
    },
  });

  const productMap = new Map(products.map((product: any) => [product.id, product]));
  return {
    products: productIds.map((id) => productMap.get(id)).filter(Boolean),
    count: totalCount,
  };
}
