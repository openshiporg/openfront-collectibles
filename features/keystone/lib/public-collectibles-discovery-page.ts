export const MAX_PUBLIC_COLLECTIBLES_DISCOVERY_OFFSET = 100_000;

export interface PublicCollectiblesDiscoveryPageInput {
  criteria: Record<string, unknown>;
  query: string;
  limit: number;
  offset: number;
}

export function buildPublicCollectiblesDiscoveryPageQuery({
  criteria,
  query,
  limit,
  offset,
}: PublicCollectiblesDiscoveryPageInput) {
  const values: unknown[] = [];
  const bind = (value: unknown) => {
    values.push(value);
    return `$${values.length}`;
  };
  const conditions = [
    `l.status = 'published'`,
    `l.format IN ('fixed_price', 'auction')`,
    `l."currencyCode" ~ '^[A-Z]{3}$'`,
    `(l."priceMinor" IS NULL OR l."priceMinor" >= 0)`,
    `p.status = 'published'`,
    `COALESCE(iu.quantity, 0) > 0`,
    `((l.format = 'fixed_price' AND iu.status = 'available') OR (l.format = 'auction' AND iu.status IN ('available', 'reserved') AND a.status = 'active' AND a."startAt" <= discovery_clock.observed_at AND a."endAt" > discovery_clock.observed_at))`,
  ];

  if (criteria.listingId !== undefined) conditions.push(`l.id = ${bind(criteria.listingId)}`);
  if (criteria.productVariantId !== undefined) conditions.push(`pv.id = ${bind(criteria.productVariantId)}`);
  if (criteria.category !== undefined) conditions.push(`cc.handle = ${bind(criteria.category)}`);
  if (criteria.format !== undefined) conditions.push(`l.format = ${bind(criteria.format)}`);
  if (criteria.minPriceMinor !== undefined) conditions.push(`l."priceMinor" >= ${bind(criteria.minPriceMinor)}`);
  if (criteria.maxPriceMinor !== undefined) conditions.push(`l."priceMinor" <= ${bind(criteria.maxPriceMinor)}`);

  if (query) {
    const search = bind(query);
    conditions.push(`(
      POSITION(${search} IN LOWER(COALESCE(l.title, ''))) > 0 OR
      POSITION(${search} IN LOWER(COALESCE(l."publicSummary", ''))) > 0 OR
      POSITION(${search} IN LOWER(COALESCE(s."displayName", ''))) > 0 OR
      POSITION(${search} IN LOWER(COALESCE(ci.title, ''))) > 0 OR
      POSITION(${search} IN LOWER(COALESCE(ci."catalogNumber", ''))) > 0 OR
      POSITION(${search} IN LOWER(COALESCE(ci.maker, ''))) > 0 OR
      POSITION(${search} IN LOWER(COALESCE(cc.name, ''))) > 0 OR
      POSITION(${search} IN LOWER(COALESCE(f.name, ''))) > 0 OR
      POSITION(${search} IN LOWER(COALESCE(cs.name, ''))) > 0
    )`);
  }

  const limitParameter = bind(limit);
  const offsetParameter = bind(offset);
  return {
    sql: `
      WITH discovery_clock AS (
        SELECT CURRENT_TIMESTAMP AS observed_at
      ), published_listing_counts AS (
        SELECT "inventoryUnit", COUNT(*) AS listing_count
        FROM "Listing"
        WHERE status = 'published' AND "inventoryUnit" IS NOT NULL
        GROUP BY "inventoryUnit"
      ), matching AS (
        SELECT l.id, l."publishedAt" AS published_at
        FROM "Listing" l
        CROSS JOIN discovery_clock
        JOIN published_listing_counts plc
          ON plc."inventoryUnit" = l."inventoryUnit" AND plc.listing_count = 1
        JOIN "InventoryUnit" iu ON iu.id = l."inventoryUnit"
        JOIN "Specimen" s ON s.id = iu."specimen"
        JOIN "ProductVariant" pv ON pv.id = iu."commerceVariant"
        JOIN "Product" p ON p.id = pv."product"
        LEFT JOIN "Auction" a ON a."listing" = l.id
        LEFT JOIN "CatalogItem" ci ON ci.id = s."catalogItem"
        LEFT JOIN "CollectibleCategory" cc ON cc.id = ci.category
        LEFT JOIN "Franchise" f ON f.id = ci.franchise
        LEFT JOIN "CollectibleSet" cs ON cs.id = ci."collectibleSet"
        WHERE ${conditions.join('\n          AND ')}
      ), totals AS (
        SELECT COUNT(*)::bigint AS total_count FROM matching
      ), page AS (
        SELECT id, published_at
        FROM matching
        ORDER BY published_at DESC NULLS LAST, id DESC
        LIMIT ${limitParameter} OFFSET ${offsetParameter}
      )
      SELECT page.id, totals.total_count, discovery_clock.observed_at
      FROM totals
      CROSS JOIN discovery_clock
      LEFT JOIN page ON TRUE
      ORDER BY page.published_at DESC NULLS LAST, page.id DESC
    `,
    values,
  };
}
