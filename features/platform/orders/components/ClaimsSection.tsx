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
import { EditItemDrawerClientWrapper } from "../../components/EditItemDrawerClientWrapper";
import { updateClaimStatusAction } from "../actions/claim-actions";
import { toast } from 'sonner';

interface ClaimsSectionProps {
  order: any;
  claims: any[];
  totalItems: number;
}

const claimStatusConfig: Record<string, { label: string; tone: DotTone }> = {
  // Payment Status
  na: { label: "N/A", tone: "muted" },
  not_refunded: { label: "Not refunded", tone: "warn" },
  refunded: { label: "Refunded", tone: "ok" },

  // Fulfillment Status
  not_fulfilled: { label: "Not fulfilled", tone: "warn" },
  partially_fulfilled: { label: "Partially fulfilled", tone: "info" },
  fulfilled: { label: "Fulfilled", tone: "ok" },
  shipped: { label: "Shipped", tone: "ok" },
  canceled: { label: "Canceled", tone: "danger" },
};

const claimTypeConfig: Record<string, { label: string }> = {
  refund: { label: "Refund" },
  replace: { label: "Replace" },
};

const formatCurrency = (amount: number, currencyCode: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount / 100);
};

export const ClaimsSection = ({ order, claims, totalItems }: ClaimsSectionProps) => {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [editClaimId, setEditClaimId] = useState<string>('');
  const [editClaimOpen, setEditClaimOpen] = useState(false);

  const handleStatusUpdate = async (claimId: string, statusType: 'payment' | 'fulfillment', newStatus: string) => {
    setIsUpdating(claimId);
    try {
      const response = await updateClaimStatusAction(claimId, statusType, newStatus);
      if (response.success) {
        toast.success(`Claim ${statusType} status updated successfully`);
        // Optionally trigger a page refresh or update local state
        window.location.reload();
      } else {
        toast.error(response.error || "Failed to update claim status");
      }
    } catch (error) {
      console.error('Error updating claim status:', error);
      toast.error("Failed to update claim status");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleEditClaim = (claimId: string) => {
    setEditClaimId(claimId);
    setEditClaimOpen(true);
  };

  return (
    <>
      <ListBand className="bg-background">
        {claims.map((claim: any, index: number) => {
          const typeConfig = claimTypeConfig[claim.type as keyof typeof claimTypeConfig];
          const paymentStatusConfig = claimStatusConfig[claim.paymentStatus as keyof typeof claimStatusConfig];
          const fulfillmentStatusConfig = claimStatusConfig[claim.fulfillmentStatus as keyof typeof claimStatusConfig];
          const primaryStatus = claim.type === 'refund' ? paymentStatusConfig : fulfillmentStatusConfig;
          const primaryRaw = claim.type === 'refund' ? claim.paymentStatus : claim.fulfillmentStatus;

          return (
            <div key={claim.id} className="flex items-start gap-3 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-sm font-medium text-foreground">
                    Claim <span className="font-mono tabular-nums">#{index + 1}</span>
                  </span>
                  <span className="text-xs text-foreground">{typeConfig?.label || claim.type}</span>
                  <span className="inline-flex items-baseline gap-1.5 text-xs text-muted-foreground">
                    <Dot tone={primaryStatus?.tone || "muted"} />
                    {primaryStatus?.label || primaryRaw}
                  </span>
                  {claim.type !== 'refund' && paymentStatusConfig && paymentStatusConfig.label !== 'N/A' && (
                    <span className="text-xs text-muted-foreground">Payment: {paymentStatusConfig.label}</span>
                  )}
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-3 font-mono text-xs tabular-nums text-muted-foreground">
                  <span>{new Date(claim.createdAt).toLocaleDateString()}</span>
                  {claim.refundAmount > 0 && (
                    <span className="text-foreground">
                      {formatCurrency(claim.refundAmount, order.currency?.code)}
                    </span>
                  )}
                </div>
                {claim.claimItems && claim.claimItems.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5 text-xs">
                    {claim.claimItems.slice(0, 2).map((item: any) => (
                      <li key={item.id} className="flex flex-wrap items-baseline gap-x-2">
                        <span className="min-w-0 truncate text-foreground">
                          {item.lineItem?.title || 'Unknown Item'}
                          {item.lineItem?.variantData?.title && ` - ${item.lineItem.variantData.title}`}
                        </span>
                        <span className="font-mono tabular-nums text-muted-foreground">x{item.quantity}</span>
                        {item.reason && (
                          <span className="text-muted-foreground">{item.reason?.replace('_', ' ')}</span>
                        )}
                      </li>
                    ))}
                    {claim.claimItems.length > 2 && (
                      <li className="font-mono tabular-nums text-muted-foreground">
                        +{claim.claimItems.length - 2} more
                      </li>
                    )}
                  </ul>
                )}
              </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Claim actions"
                      disabled={isUpdating === claim.id}
                      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 max-sm:size-10"
                    >
                      <MoreVertical className="size-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {/* Payment Status Updates */}
                      {claim.type === 'refund' && claim.paymentStatus === 'not_refunded' && (
                        <DropdownMenuItem 
                          onClick={() => handleStatusUpdate(claim.id, 'payment', 'refunded')}
                        >
                          Mark as Refunded
                        </DropdownMenuItem>
                      )}
                      
                      {/* Fulfillment Status Updates */}
                      {claim.type === 'replace' && claim.fulfillmentStatus === 'not_fulfilled' && (
                        <>
                          <DropdownMenuItem 
                            onClick={() => handleStatusUpdate(claim.id, 'fulfillment', 'partially_fulfilled')}
                          >
                            Mark Partially Fulfilled
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusUpdate(claim.id, 'fulfillment', 'fulfilled')}
                          >
                            Mark Fulfilled
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      {claim.type === 'replace' && claim.fulfillmentStatus === 'fulfilled' && (
                        <DropdownMenuItem 
                          onClick={() => handleStatusUpdate(claim.id, 'fulfillment', 'shipped')}
                        >
                          Mark as Shipped
                        </DropdownMenuItem>
                      )}
                      
                      {claim.type === 'replace' && claim.fulfillmentStatus === 'partially_fulfilled' && (
                        <>
                          <DropdownMenuItem 
                            onClick={() => handleStatusUpdate(claim.id, 'fulfillment', 'fulfilled')}
                          >
                            Mark Fully Fulfilled
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusUpdate(claim.id, 'fulfillment', 'shipped')}
                          >
                            Mark as Shipped
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      {/* General Actions */}
                      <DropdownMenuItem onClick={() => handleEditClaim(claim.id)}>
                        Edit Claim
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleStatusUpdate(claim.id, 'fulfillment', 'canceled')}
                        className="text-red-600"
                      >
                        Cancel Claim
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
          );
        })}
      </ListBand>

      {/* Edit Claim Drawer */}
      {editClaimId && (
        <EditItemDrawerClientWrapper
          listKey="claim-orders"
          itemId={editClaimId}
          open={editClaimOpen}
          onClose={() => {
            setEditClaimOpen(false);
            setEditClaimId('');
          }}
        />
      )}
    </>
  );
};