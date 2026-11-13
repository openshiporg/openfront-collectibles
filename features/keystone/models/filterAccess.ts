// Filter and order access follow read access. Keystone checks only isFilterable/isOrderable for where and orderBy,
// so a field or relation hidden from a role must say so here too, or a count filter can read it back.
type Args = { session?: any; context?: any; listKey?: string; fieldKey?: string };
type Rule = boolean | ((args: any) => unknown) | undefined;

const NEVER_FILTERABLE = new Set([
  'ApiKey.tokenSecret',
  'Invite.token',
  'OAuthApp.clientSecret',
  'OAuthToken.token',
  'OAuthToken.refreshToken',
  'OAuthToken.accessToken',
  'Order.secretKey',
  'User.password',
  'User.customerToken',
  'WebhookEndpoint.secret',
  'ShippingProvider.accessToken',
]);

const run = async (rule: Rule, args: any, fallback: boolean): Promise<boolean> => {
  if (rule === undefined) return fallback;
  if (typeof rule === 'boolean') return rule;
  try {
    return Boolean(await rule(args));
  } catch {
    return false;
  }
};

const listOperationQuery = (config: any): Rule => {
  const access = config?.access;
  if (typeof access === 'function') return access;
  return access?.operation?.query ?? access?.operation;
};
const listFilterQuery = (config: any): Rule => config?.access?.filter?.query;

// The session may read the target list: operation access passes and the row filter is not a refusal.
async function canReadList(config: any, args: Args, listKey: string): Promise<boolean> {
  const session = args.session;
  const a = { session: args.session, context: args.context, listKey, operation: 'query' };
  const operation = listOperationQuery(config);
  if (!(await run(typeof operation === 'object' ? undefined : operation, a, true))) return false;
  const filter = listFilterQuery(config);
  if (filter === undefined) return true;
  if (typeof filter === 'boolean') return filter;
  let result: unknown;
  try {
    result = await filter(a);
  } catch {
    return false;
  }
  if (result === false) return false;
  if (result === true || typeof result !== 'object' || result === null) return true;
  // A row filter scoped to the viewer (their own orders, addresses, user row) only protects reads of that list.
  // Reaching it through another list's relation would expose rows outside the scope, so require the unscoped read.
  if (Object.keys(result).length === 0) return true;
  const identity = session?.itemId;
  return !(identity && JSON.stringify(result).includes(String(identity)));
}

function fieldReadRule(f: any): Rule {
  const access = f?.access;
  if (typeof access === 'function') return access;
  return access?.read;
}

export function withFilterAccess<T extends Record<string, any>>(models: T): T {
  return Object.fromEntries(
    Object.entries(models).map(([listKey, config]: [string, any]) => {
      if (!config?.fields) return [listKey, config];
      const fields = Object.fromEntries(
        Object.entries(config.fields).map(([fieldKey, fieldFn]: [string, any]) => {
          if (typeof fieldFn !== 'function') return [fieldKey, fieldFn];
          return [
            fieldKey,
            (data: any) => {
              const f = fieldFn(data);
              const never = NEVER_FILTERABLE.has(`${listKey}.${fieldKey}`);
              const read = fieldReadRule(f);
              const target = f?.dbField?.kind === 'relation' ? models[f.dbField.list as string] : undefined;
              const gate = (existing: Rule) => {
                if (never || existing === false) return false;
                if (read === undefined && !target && existing === undefined) return existing;
                return async (args: Args) => {
                  const a = { ...args, operation: 'query' };
                  if (!(await run(existing, a, true))) return false;
                  if (!(await run(read, a, true))) return false;
                  if (target && !(await canReadList(target, args, f.dbField.list))) return false;
                  return true;
                };
              };
              return { ...f, isFilterable: gate(f.isFilterable), isOrderable: gate(f.isOrderable) };
            },
          ];
        }),
      );
      return [listKey, { ...config, fields }];
    }),
  ) as T;
}
