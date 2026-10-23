"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import { Dot } from "@/features/platform/components/vault-ui";
import { EditItemDrawerClientWrapper } from "@/features/platform/components/EditItemDrawerClientWrapper";
import type { ApiKey } from "../actions/getApiKeys";
import {
  differenceInHours,
  format,
  parseISO,
  differenceInMinutes,
} from "date-fns";

interface ApiKeyDetailsComponentProps {
  apiKey: ApiKey;
  loadingActions?: Record<string, Record<string, boolean>>;
  removeEditItemButton?: boolean;
  renderButtons?: () => React.ReactNode;
}

export const ApiKeyDetailsComponent = ({
  apiKey,
  loadingActions = {},
  removeEditItemButton,
  renderButtons,
}: ApiKeyDetailsComponentProps) => {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  const currentAction = Object.entries(loadingActions).find(
    ([_, value]) => value[apiKey.id]
  )?.[0];

  const getLoadingText = (action: string) => {
    switch (action) {
      case "deleteApiKey":
        return "Deleting API Key";
      default:
        return "Loading";
    }
  };

  const usageCount = apiKey.usageCount?.total || 0;
  const isExpired = apiKey.expiresAt && new Date() > new Date(apiKey.expiresAt);

  function formatDate(dateString: string) {
    const date = parseISO(dateString);
    const now = new Date();
    const minutesDifference = differenceInMinutes(now, date);
    const hoursDifference = differenceInHours(now, date);

    if (minutesDifference < 60) {
      return `${minutesDifference} minutes ago`;
    } else if (hoursDifference < 24) {
      return `${hoursDifference} hours ago`;
    } else {
      return format(date, "PPP");
    }
  }

  const statusTone = isExpired
    ? "danger"
    : apiKey.status === "active"
    ? "ok"
    : apiKey.status === "inactive"
    ? "warn"
    : apiKey.status === "revoked"
    ? "danger"
    : "muted";

  return (
    <>
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <Dot tone={statusTone} />
            <h3 className="text-sm font-semibold text-foreground">{apiKey.name}</h3>
            <span className="text-xs capitalize text-muted-foreground">{apiKey.status}</span>
            {isExpired && <span className="text-xs text-destructive">Expired</span>}
          </div>

          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="font-mono tabular-nums text-foreground">{apiKey.tokenPreview}</span>
            <span>
              <span className="font-mono tabular-nums">{apiKey.scopes.length}</span> scope{apiKey.scopes.length !== 1 ? 's' : ''}
            </span>
            <span>
              <span className="font-mono tabular-nums">{usageCount}</span> request{usageCount !== 1 ? 's' : ''}
            </span>
            <span>
              {apiKey.lastUsedAt
                ? `Last used ${formatDate(apiKey.lastUsedAt)}`
                : "Never used"
              }
            </span>
          </div>

          {apiKey.scopes.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {apiKey.scopes.slice(0, 3).map((scope) => (
                <span
                  key={scope}
                  className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
                >
                  {scope}
                </span>
              ))}
              {apiKey.scopes.length > 3 && (
                <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                  +{apiKey.scopes.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
              variant="ghost"
              size="icon"
              className="size-10 rounded-full sm:size-8 [&_svg]:size-4"
              aria-label="Edit"
              onClick={() => setIsEditDrawerOpen(true)}
            >
              <MoreVertical className="stroke-muted-foreground" />
            </Button>
        </div>
      </div>

      <EditItemDrawerClientWrapper
        listKey="apiKeys"
        itemId={apiKey.id}
        open={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
      />
    </>
  );
};