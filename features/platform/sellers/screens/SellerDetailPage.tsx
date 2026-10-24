import { notFound } from 'next/navigation';
import { getSeller } from '../actions';
import { SellerDetailPageClient } from './SellerDetailPageClient';

export async function SellerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await getSeller(id);
  if (!response.success) throw new Error('Seller unavailable');
  if (!response.data) notFound();
  return <SellerDetailPageClient seller={response.data} />;
}
