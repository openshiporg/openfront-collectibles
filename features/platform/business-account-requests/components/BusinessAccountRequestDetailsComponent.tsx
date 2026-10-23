"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Check, CheckCircle, XCircle } from "lucide-react";
import { Dot, SectionTitle, type DotTone } from "../../components/vault-ui";
import { EditItemDrawerClientWrapper } from "../../components/EditItemDrawerClientWrapper";
import { updateBusinessAccountRequestStatus } from "../actions";
import { toast } from "@/components/ui/use-toast";

const statusTones: Record<string, DotTone> = {
  pending: "info",
  approved: "ok",
  not_approved: "danger",
  requires_info: "warn",
};

interface BusinessAccountRequest {
  id: string;
  businessName: string;
  businessType: string;
  monthlyOrderVolume: string;
  requestedCreditLimit: number;
  formattedRequestedCredit: string;
  businessDescription: string;
  status: string;
  statusLabel: string;
  submittedAt: string;
  reviewNotes?: string;
  approvedCreditLimit?: number;
  formattedApprovedCredit?: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface BusinessAccountRequestDetailsComponentProps {
  businessAccountRequest: BusinessAccountRequest;
  list: any;
}

export function BusinessAccountRequestDetailsComponent({ 
  businessAccountRequest, 
  list 
}: BusinessAccountRequestDetailsComponentProps) {
  const router = useRouter();
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState(businessAccountRequest.reviewNotes || '');
  const [approvedCredit, setApprovedCredit] = useState(
    businessAccountRequest.approvedCreditLimit ? (businessAccountRequest.approvedCreditLimit / 100).toString() : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getBusinessTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      wholesale: 'Wholesale Partner',
      distribution: 'Distribution Channel',
      reseller: 'Authorized Reseller',
      b2b_platform: 'B2B Platform',
      other: 'Other'
    };
    return typeMap[type] || type;
  };

  const getVolumeLabel = (volume: string) => {
    const volumeMap: Record<string, string> = {
      low: '1-50 orders/month',
      medium: '51-200 orders/month',
      high: '201-1000 orders/month',
      enterprise: '1000+ orders/month'
    };
    return volumeMap[volume] || volume;
  };

  const handleReviewSubmit = async (action: 'approved' | 'rejected') => {
    setIsSubmitting(true);
    try {
      const result = await updateBusinessAccountRequestStatus(
        businessAccountRequest.id,
        action,
        reviewNotes,
        approvedCredit ? parseInt(approvedCredit) * 100 : undefined
      );

      if (result.success) {
        toast({
          title: "Request Updated",
          description: `Account request has been ${action}.`,
        });
        setIsReviewDialogOpen(false);
        router.refresh(); // Refresh the page to show updated data
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update request.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error", 
        description: error.message || "Failed to update request.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <Dot tone={statusTones[businessAccountRequest.status] || "muted"} />
            <h3 className="text-sm font-semibold text-foreground">{businessAccountRequest.businessName}</h3>
            <span className="text-xs text-muted-foreground">{businessAccountRequest.statusLabel}</span>
          </div>

          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="min-w-0 truncate">
              {businessAccountRequest.user
                ? `${businessAccountRequest.user.name} (${businessAccountRequest.user.email})`
                : "User information unavailable"
              }
            </span>
            <span>
              <span className="font-mono tabular-nums text-foreground">{businessAccountRequest.formattedRequestedCredit}</span> requested
            </span>
            <span>
              Submitted <span className="font-mono tabular-nums">{new Date(businessAccountRequest.submittedAt).toLocaleDateString()}</span>
            </span>
          </div>
          {businessAccountRequest.reviewNotes && (
            <p className="mt-2 border-l-2 border-border pl-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Review notes</span> {businessAccountRequest.reviewNotes}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {businessAccountRequest.status === 'pending' && (
            <Button
              variant="ghost"
              size="icon"
              className="size-10 rounded-full sm:size-8 [&_svg]:size-4"
              aria-label="Review"
              onClick={() => setIsReviewDialogOpen(true)}
            >
              <Check className="stroke-muted-foreground" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-10 rounded-full sm:size-8 [&_svg]:size-4"
                aria-label="Actions"
              >
                <MoreVertical className="stroke-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditDrawerOpen(true)}>
                Edit Request
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                Delete Request
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review {businessAccountRequest.businessName}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-5">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Business name</dt>
                <dd className="mt-0.5 text-foreground">{businessAccountRequest.businessName}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Business type</dt>
                <dd className="mt-0.5 text-foreground">{getBusinessTypeLabel(businessAccountRequest.businessType)}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">Contact</dt>
                <dd className="mt-0.5 text-foreground">
                  {businessAccountRequest.user ? (
                    <>
                      <span className="block">{businessAccountRequest.user.name}</span>
                      <span className="block truncate text-muted-foreground">{businessAccountRequest.user.email}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">User information unavailable</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Monthly volume</dt>
                <dd className="mt-0.5 font-mono tabular-nums text-foreground">{getVolumeLabel(businessAccountRequest.monthlyOrderVolume)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Requested credit</dt>
                <dd className="mt-0.5 font-mono tabular-nums text-foreground">{businessAccountRequest.formattedRequestedCredit}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Submitted</dt>
                <dd className="mt-0.5 font-mono tabular-nums text-foreground">{new Date(businessAccountRequest.submittedAt).toLocaleString()}</dd>
              </div>
            </dl>

            <div>
              <SectionTitle>Business description</SectionTitle>
              <p className="text-sm text-foreground">{businessAccountRequest.businessDescription}</p>
            </div>

            <div className="space-y-4 border-t border-border pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="approvedCredit">Approved credit limit (USD)</Label>
                <Input
                  id="approvedCredit"
                  type="number"
                  className="font-mono tabular-nums"
                  placeholder={(businessAccountRequest.requestedCreditLimit / 100).toString()}
                  value={approvedCredit}
                  onChange={(e) => setApprovedCredit(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reviewNotes">Review notes</Label>
                <Textarea
                  id="reviewNotes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => handleReviewSubmit('approved')}
                  className="h-10 rounded-full px-5"
                  disabled={isSubmitting}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve Request
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReviewSubmit('rejected')}
                  className="h-10 rounded-full px-5"
                  disabled={isSubmitting}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject Request
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <EditItemDrawerClientWrapper
        listKey="business-account-requests"
        itemId={businessAccountRequest.id}
        open={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        onSave={() => {
          router.refresh();
        }}
      />
    </>
  );
}