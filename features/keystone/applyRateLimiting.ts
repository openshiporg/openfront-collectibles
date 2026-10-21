import { RateLimiterMemory, type IRateLimiterOptions } from 'rate-limiter-flexible';
import type { GraphQLFieldResolver, GraphQLResolveInfo } from 'graphql';
import type { Context } from '.keystone/types';

// Optional middleware surface retained from the family. It is not enabled by
// importing this module; the schema configuration must explicitly compose it.
const defaults: IRateLimiterOptions = { points: 50, duration: 900, blockDuration: 900 };
const custom: Record<string, IRateLimiterOptions> = {
  createUser: { points: 5, duration: 900, blockDuration: 600 },
  createCart: { points: 10, duration: 900, blockDuration: 300 },
};
const limiters: Record<string, RateLimiterMemory> = { default: new RateLimiterMemory(defaults) };
for (const [operation, config] of Object.entries(custom)) limiters[operation] = new RateLimiterMemory(config);

async function applyRateLimit(context: Context, operation: string) {
  // Never trust arbitrary forwarding headers for a limiter identity.
  const ip = context.req?.socket?.remoteAddress || 'unknown-client';
  const limiter = limiters[operation] || limiters.default;
  try {
    const result = await limiter.consume(ip);
    context.res?.setHeader('X-RateLimit-Limit', limiter.points);
    context.res?.setHeader('X-RateLimit-Remaining', result.remainingPoints);
    context.res?.setHeader('X-RateLimit-Reset', new Date(Date.now() + result.msBeforeNext).toUTCString());
  } catch (error) {
    const ms = error && typeof error === 'object' && 'msBeforeNext' in error && typeof error.msBeforeNext === 'number' && Number.isFinite(error.msBeforeNext) ? error.msBeforeNext : 60_000;
    const retryAfter = Math.max(1, Math.ceil(ms / 1000));
    context.res?.setHeader('Retry-After', String(retryAfter));
    context.res?.setHeader('X-RateLimit-Limit', limiter.points);
    context.res?.setHeader('X-RateLimit-Remaining', 0);
    throw new Error(`Too many requests. Try again in ${retryAfter} seconds.`);
  }
}

type Resolver = GraphQLFieldResolver<unknown, Context, Record<string, unknown>>;
type Middleware = (resolve: Resolver, root: unknown, args: Record<string, unknown>, context: Context, info: GraphQLResolveInfo) => Promise<unknown>;
export const applyRateLimiting: { Query: Record<string, Middleware>; Mutation: Record<string, Middleware> } = { Query: {}, Mutation: {} };
const operations = {
  Query: ['products', 'productCollections', 'productCategories', 'productOptions', 'productOptionValues', 'productVariants', 'currencies', 'regions', 'shippingOptions', 'stores', 'countries', 'moneyAmounts'],
  Mutation: ['createCart', 'createUser', 'authenticateUserWithPassword'],
} as const;
for (const kind of ['Query', 'Mutation'] as const) {
  for (const operation of operations[kind]) {
    applyRateLimiting[kind][operation] = async (resolve, root, args, context, info) => {
      await applyRateLimit(context, operation);
      return resolve(root, args, context, info);
    };
  }
}
