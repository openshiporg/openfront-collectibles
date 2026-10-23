'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Dot, ListBand } from '@/features/platform/components/vault-ui';
import { Button } from '@/components/ui/button';
import { UnfulfilledItems } from '../components/UnfulfilledItems';
import { FulfillmentHistory } from '../components/FulfillmentHistory';
import { ShippingTabs } from '../components/ShippingTabs';
import { cancelFulfillment, toggleProvider } from '@/features/platform/orders/actions';
import { notFound } from 'next/navigation';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Order } from '../types';

interface FulfillOrderClientProps {
  order: Order;
}

export function FulfillOrderClient({ order }: FulfillOrderClientProps) {
  const router = useRouter();
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  if (!order) {
    return notFound();
  }

  const handleProviderToggle = async (providerId: string) => {
    setIsLoading(true);
    const response = await toggleProvider(providerId);

    if (response.success) {
      toast.success('Provider status updated successfully');
      router.refresh();
    } else {
      console.error('Failed to toggle provider:', response.error, response.errors);
      toast.error('Failed to update provider', {
        description: response.error
      });
    }
    setIsLoading(false);
  };

  const handleDeleteFulfillment = async (id: string) => {
    setIsLoading(true);
    const response = await cancelFulfillment(id);

    if (response.success) {
      toast.success('Fulfillment cancelled successfully');
      router.refresh();
    } else {
      console.error('Failed to cancel fulfillment:', response.error, response.errors);
      toast.error('Failed to cancel fulfillment', {
        description: response.error
      });
    }
    setIsLoading(false);
  };

  const handleCancelAll = async () => {
    setIsLoading(true);
    const activeFulfillments = order.fulfillmentDetails?.filter(f => !f.canceledAt) || [];
    
    for (const fulfillment of activeFulfillments) {
      await handleDeleteFulfillment(fulfillment.id);
    }
    setIsLoading(false);
  };

  const unfulfilledItems = order.unfulfilled || [];
  const isFullyFulfilled = unfulfilledItems.length === 0;

  return (
    <div>
      <div className="max-w-6xl space-y-8 p-4 pb-10 md:p-6">
        <div className="space-y-3">
          <Link
            href={`/dashboard/platform/orders/${order.id}`}
            className="inline-flex min-h-8 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Order <span className="font-mono tabular-nums">#{order.displayId}</span>
          </Link>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Fulfill order</h1>
              <span className="inline-flex items-baseline gap-1.5 text-sm text-muted-foreground">
                <Dot tone={isFullyFulfilled ? 'ok' : 'warn'} />
                {isFullyFulfilled ? 'Fulfilled' : (
                  <><span className="font-mono tabular-nums">{unfulfilledItems.length}</span> unfulfilled</>
                )}
              </span>
            </div>
            <div className="font-mono text-sm tabular-nums text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="min-w-0 space-y-8 lg:col-span-8">
            {isFullyFulfilled ? (
              <ListBand>
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <span className="flex items-baseline gap-2.5 text-sm text-foreground">
                    <Dot tone="ok" />
                    All items fulfilled
                  </span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex min-h-9 items-center rounded-full bg-background px-4 text-sm font-medium text-foreground shadow-xs ring-1 ring-border disabled:opacity-50 max-sm:min-h-10"
                        disabled={isLoading}
                      >
                        Start over
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[250px] p-3" side="bottom">
                      <div className="space-y-2.5">
                        <p className="text-[13px] font-medium">
                          Cancel all fulfillments?
                        </p>
                        <div className="flex justify-end">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 rounded-full text-xs"
                            onClick={handleCancelAll}
                            disabled={isLoading}
                          >
                            Cancel All
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </ListBand>
            ) : (
              <UnfulfilledItems
                items={unfulfilledItems}
                selectedQuantities={selectedQuantities}
                setSelectedQuantities={setSelectedQuantities}
                order={order}
              />
            )}
            {order.fulfillmentDetails && order.fulfillmentDetails.length > 0 && (
              <FulfillmentHistory
                fulfillments={order.fulfillmentDetails}
                order={{
                  id: order.id,
                  unfulfilled: order.unfulfilled?.map(item => ({
                    id: item.id,
                    quantity: item.quantity,
                  })) || []
                }}
                onDelete={handleDeleteFulfillment}
              />
            )}
          </div>

          {!isFullyFulfilled && (
            <div className="min-w-0 space-y-6 lg:col-span-4">
              <div className="lg:sticky lg:top-6">
                <ShippingTabs
                  order={order}
                  onProviderToggle={handleProviderToggle}
                  selectedQuantities={selectedQuantities}
                  setSelectedQuantities={setSelectedQuantities}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 