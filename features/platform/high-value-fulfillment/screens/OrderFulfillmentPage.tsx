import { notFound } from 'next/navigation';
import { getOrderFulfillment } from '../actions';
import { OrderFulfillmentPageClient } from './OrderFulfillmentPageClient';

export async function OrderFulfillmentPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const response = await getOrderFulfillment(orderId);
  if (!response.success) throw new Error('Order fulfillment unavailable');
  if (!response.data) notFound();
  return <OrderFulfillmentPageClient {...response.data} />;
}
