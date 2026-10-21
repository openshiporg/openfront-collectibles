import type { Context } from '.keystone/types';

export default async function redirectToInit(_root: unknown, _args: unknown, context: Context) {
  return (await context.sudo().query.User.count({})) === 0;
}
