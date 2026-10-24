import { notFound } from 'next/navigation';
import { getDispute, getDisputeFormOptions } from '../actions';
import { DisputeDetailPageClient } from './DisputeDetailPageClient';

export async function DisputeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [response, options] = await Promise.all([getDispute(id), getDisputeFormOptions()]);
  if (!response.success) throw new Error('Case unavailable');
  if (!response.data) notFound();
  return <DisputeDetailPageClient dispute={response.data} staff={options.staff} />;
}
