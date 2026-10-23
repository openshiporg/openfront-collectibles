"use client";

import React, { useState } from "react";
import { Dot, ListBand, type DotTone } from "@/features/platform/components/vault-ui";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { CreateReturnModal } from "./modals/CreateReturnModal";
import { updateReturnStatusAction } from "../actions/return-actions";
import { toast } from 'sonner';

interface ReturnsSectionProps {
  order: any;
  returns: any[];
  totalItems: number;
}

const returnStatusConfig: Record<string, { label: string; tone: DotTone }> = {
  requested: { label: "Requested", tone: "warn" },
  received: { label: "Received", tone: "info" },
  requires_action: { label: "Requires action", tone: "warn" },
  canceled: { label: "Canceled", tone: "danger" },
};

const formatCurrency = (amount: number, currencyCode: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount / 100);
};

export const ReturnsSection = ({ order, returns, totalItems }: ReturnsSectionProps) => {
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleStatusUpdate = async (returnId: string, newStatus: string) => {
    setIsUpdating(returnId);
    try {
      const response = await updateReturnStatusAction(returnId, newStatus);
      if (response.success) {
        toast.success("Return status updated successfully");
        // Optionally trigger a page refresh or update local state
        window.location.reload();
      } else {
        toast.error(response.error || "Failed to update return status");
      }
    } catch (error) {
      console.error('Error updating return status:', error);
      toast.error("Failed to update return status");
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <>
      <ListBand className="bg-background">
        {returns.map((returnItem: any, index: number) => {
          const statusConfig = returnStatusConfig[returnItem.status as keyof typeof returnStatusConfig];

          return (
            <div key={returnItem.id} className="flex items-start gap-3 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-sm font-medium text-foreground">
                    Return <span className="font-mono tabular-nums">#{index + 1}</span>
                  </span>
                  <span className="inline-flex items-baseline gap-1.5 text-xs text-muted-foreground">
                    <Dot tone={statusConfig?.tone || "muted"} />
                    {statusConfig?.label || returnItem.status}
                  </span>
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-3 font-mono text-xs tabular-nums text-muted-foreground">
                  <span>{new Date(returnItem.createdAt).toLocaleDateString()}</span>
                  {returnItem.refundAmount > 0 && (
                    <span className="text-foreground">
                      {formatCurrency(returnItem.refundAmount, order.currency?.code)}
                    </span>
                  )}
                </div>
                {returnItem.returnItems && returnItem.returnItems.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5 text-xs">
                    {returnItem.returnItems.slice(0, 2).map((item: any) => (
                      <li key={item.id} className="flex flex-wrap items-baseline gap-x-2">
                        <span className="min-w-0 truncate text-foreground">
                          {item.lineItem?.title || 'Unknown Item'}
                          {item.lineItem?.variantTitle && ` - ${item.lineItem.variantTitle}`}
                        </span>
                        <span className="font-mono tabular-nums text-muted-foreground">x{item.quantity}</span>
                        {item.reason && (
                          <span className="text-muted-foreground">{item.reason?.replace('_', ' ')}</span>
                        )}
                      </li>
                    ))}
                    {returnItem.returnItems.length > 2 && (
                      <li className="font-mono tabular-nums text-muted-foreground">
                        +{returnItem.returnItems.length - 2} more
                      </li>
                    )}
                  </ul>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Return actions"
                    disabled={isUpdating === returnItem.id}
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 max-sm:size-10"
                  >
                    <MoreVertical className="size-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {returnItem.status === 'requested' && (
                    <>
                      <DropdownMenuItem
                        onClick={() => handleStatusUpdate(returnItem.id, 'received')}
                      >
                        Mark as Received
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusUpdate(returnItem.id, 'requires_action')}
                      >
                        Requires Action
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusUpdate(returnItem.id, 'canceled')}
                        className="text-red-600"
                      >
                        Cancel Return
                      </DropdownMenuItem>
                    </>
                  )}
                  {returnItem.status === 'received' && (
                    <DropdownMenuItem
                      onClick={() => handleStatusUpdate(returnItem.id, 'requires_action')}
                    >
                      Requires Action
                    </DropdownMenuItem>
                  )}
                  {returnItem.status === 'requires_action' && (
                    <DropdownMenuItem
                      onClick={() => handleStatusUpdate(returnItem.id, 'received')}
                    >
                      Mark as Received
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </ListBand>

      <CreateReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        order={order}
      />
    </>
  );
};