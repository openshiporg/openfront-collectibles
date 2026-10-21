import type { Context } from '.keystone/types';
import { permissions } from '../access';
import getFinanceClose, { groupFinanceRows } from '../queries/getFinanceClose';

export default async function getAnalytics(_root: unknown, { timeframe = '7d' }: { timeframe?: string | null }, context: Context) {
  if (!context.session?.itemId || !permissions.canReadOrders({ session: context.session }) || !permissions.canReadProducts({ session: context.session }) || !permissions.canReadPayments({ session: context.session })) throw new Error('Access denied');
  const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : null;
  if (days === null) throw new Error('Invalid timeframe');
  const end = new Date(), start = new Date(end.getTime() - days * 86_400_000), range = { gte: start, lt: end };
  const sudo = context.sudo();
  // Same admitted scope as the family report, bounded native projections only.
  // Financial observations compose the close ledger; formatted order totals and
  // a static FX table are never a source of reporting money.
  const [orders, products, totalCustomers, newCustomers] = await Promise.all([
    sudo.prisma.order.findMany({ where: { createdAt: range }, take: 5001, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], select: { id: true, status: true, createdAt: true, userId: true } }),
    sudo.prisma.product.findMany({ take: 5001, orderBy: { id: 'asc' }, select: { id: true, title: true, status: true, productVariants: { take: 501, select: { inventoryQuantity: true } } } }),
    sudo.prisma.user.count({ where: { orders: { some: {} } } }),
    sudo.prisma.user.count({ where: { createdAt: range, orders: { some: {} } } }),
  ]);
  if (orders.length > 5000 || products.length > 5000 || products.some(product => product.productVariants.length > 500)) throw new Error('Analytics exceeds the bounded reporting limit');
  const financeRows: Awaited<ReturnType<typeof getFinanceClose>>['rows'] = [];
  for (let cursor = start.getTime(); cursor < end.getTime();) {
    const next = Math.min(cursor + 31 * 86_400_000, end.getTime());
    const close = await getFinanceClose(null, { start: new Date(cursor).toISOString(), end: new Date(next).toISOString() }, context);
    financeRows.push(...close.rows); cursor = next;
  }
  const byStatus: Record<string, number> = {}, byDay: Record<string, number> = {};
  for (const order of orders) { byStatus[order.status] = (byStatus[order.status] ?? 0) + 1; const date = order.createdAt.toISOString().slice(0, 10); byDay[date] = (byDay[date] ?? 0) + 1; }
  const stock = products.map(product => ({ id: product.id, title: product.title, status: product.status, variants: product.productVariants.length, quantity: product.productVariants.reduce((sum, variant) => sum + variant.inventoryQuantity, 0) }));
  return {
    range: { start: start.toISOString(), end: end.toISOString() },
    orders: { total: orders.length, byStatus, timeline: Object.entries(byDay).map(([date, count]) => ({ date, count })) },
    inventory: { total: products.length, products: stock, totalStock: stock.reduce((sum, product) => sum + product.quantity, 0) },
    customers: { total: totalCustomers, new: newCustomers, active: new Set(orders.flatMap(order => order.userId ? [order.userId] : [])).size },
    payments: { byCurrency: groupFinanceRows(financeRows), exceptions: financeRows.filter(row => row.exception).map(row => ({ paymentId: row.paymentId, currency: row.currency, exception: row.exception })), settlementStatus: 'not_reconciled' as const },
  };
}
export type AnalyticsReport = Awaited<ReturnType<typeof getAnalytics>>;
