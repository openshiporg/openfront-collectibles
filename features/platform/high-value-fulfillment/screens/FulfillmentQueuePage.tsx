import { getFulfillmentQueue } from '../actions';
import { QUEUES, type QueueKey } from '../lib/constants';
import { FulfillmentQueuePageClient } from './FulfillmentQueuePageClient';

export async function FulfillmentQueuePage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const rawQueue = Array.isArray(params.queue) ? params.queue[0] : params.queue;
  const queue: QueueKey = QUEUES.some((q) => q.value === rawQueue) ? (rawQueue as QueueKey) : 'needs';
  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const page = Math.min(Math.max(parseInt(rawPage || '1', 10) || 1, 1), 1000);
  const pageSize = 25;
  const response = await getFulfillmentQueue(queue, pageSize, (page - 1) * pageSize);
  return (
    <FulfillmentQueuePageClient
      queue={queue}
      page={page}
      pageSize={pageSize}
      items={response.success ? response.data.items : []}
      count={response.success ? response.data.count : 0}
      counts={response.success ? response.data.counts : { needs: 0, set: 0, all: 0 }}
      error={response.success ? null : 'Orders unavailable'}
    />
  );
}
