'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Dot, ListBand } from '../../components/vault-ui';
import { createOAuthToken, denyOAuthApp } from '../actions/oauth';

interface OAuthParams {
  clientId: string;
  scope: string;
  redirectUri: string;
  state: string;
  responseType: string;
}

interface OAuthInstallDialogClientProps {
  isOpen: boolean;
  oauthParams: OAuthParams;
  initialData: {
    success: boolean;
    app?: any;
    requestedScopes?: string[];
    error?: string;
  };
}

export const OAuthInstallDialogClient: React.FC<OAuthInstallDialogClientProps> = ({
  isOpen,
  oauthParams,
  initialData,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handleClose = () => {
    // Clear search params to close the dialog
    router.replace('/dashboard/platform/apps');
  };

  const handleAuthorize = async () => {
    try {
      setIsProcessing(true);
      await createOAuthToken(
        oauthParams.clientId,
        oauthParams.scope,
        oauthParams.redirectUri,
        oauthParams.state
      );
    } catch (err) {
      console.error('Failed to authorize:', err);
      setIsProcessing(false);
    }
  };

  const handleDeny = async () => {
    try {
      setIsProcessing(true);
      await denyOAuthApp(oauthParams.redirectUri, oauthParams.state);
    } catch (err) {
      console.error('Failed to deny:', err);
      setIsProcessing(false);
    }
  };

  const getScopeDescription = (scope: string): string => {
    const descriptions: Record<string, string> = {
      read_products: 'Read your products',
      write_products: 'Manage your products',
      read_orders: 'Read your orders',
      write_orders: 'Manage your orders',
      read_customers: 'Read your customers',
      write_customers: 'Manage your customers',
      read_webhooks: 'Read your webhooks',
      write_webhooks: 'Manage your webhooks',
    };
    return descriptions[scope] || `Access to ${scope}`;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()} modal>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {initialData.success && initialData.app
              ? `Install ${initialData.app.name}`
              : 'Installation Required'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {initialData.success
              ? 'Requested permissions'
              : 'Unable to process authorization'}
          </p>
        </DialogHeader>

        <div className="py-2">
          {!initialData.success ? (
            <div className="flex items-baseline gap-2.5 rounded-xl bg-muted/40 px-4 py-3 text-sm text-foreground ring-1 ring-inset ring-border/60">
              <Dot tone="danger" />
              <span className="text-destructive">{initialData.error}</span>
            </div>
          ) : initialData.app ? (
            <>
              <ListBand>
                {initialData.requestedScopes?.map((scope) => (
                  <div key={scope} className="flex items-baseline justify-between gap-3 px-4 py-2.5">
                    <span className="inline-flex items-baseline gap-2.5 text-sm text-foreground">
                      <Dot tone="ok" />
                      {getScopeDescription(scope)}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">{scope}</span>
                  </div>
                ))}
              </ListBand>

              {initialData.app.description && (
                <p className="mt-4 text-sm text-muted-foreground">
                  {initialData.app.description}
                </p>
              )}
            </>
          ) : null}
        </div>

        <DialogFooter>
          <div className="flex gap-2 w-full">
            <Button
              variant="ghost"
              onClick={handleClose}
              className="h-10 flex-1 rounded-full bg-muted"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAuthorize}
              disabled={isProcessing || !initialData.success}
              className="h-10 flex-1 rounded-full"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Install
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};