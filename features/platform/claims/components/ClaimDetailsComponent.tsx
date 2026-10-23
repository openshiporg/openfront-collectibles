"use client";

import React, { useState } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import Link from "next/link";
import { Dot } from "../../components/vault-ui";
import { EditItemDrawerClientWrapper } from "../../components/EditItemDrawerClientWrapper";

interface Claim {
  id: string;
  type?: string;
  createdAt: string;
  updatedAt?: string;
  // Add more fields as needed based on your GraphQL schema
}

interface ClaimDetailsComponentProps {
  claim: Claim;
  list: any;
}

export function ClaimDetailsComponent({
  claim,
  list,
}: ClaimDetailsComponentProps) {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  return (
    <>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={claim.id} className="border-0">
          <div className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <Dot tone="info" />
                <Link
                  href={`/dashboard/platform/claims/${claim.id}`}
                  className="text-sm font-semibold text-foreground hover:underline"
                >
                  Claim <span className="font-mono tabular-nums">{claim.id.slice(-8)}</span>
                </Link>
                {claim.type && (
                  <span className="text-xs capitalize text-muted-foreground">{claim.type}</span>
                )}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                <span className="font-mono tabular-nums">
                  {new Date(claim.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
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
              <Button
                variant="ghost"
                size="icon"
                className="size-10 rounded-full sm:size-8 [&_svg]:size-4"
                asChild
              >
                <AccordionTrigger className="justify-center py-0" />
              </Button>
            </div>
          </div>
          <AccordionContent className="pb-0">
            <div className="border-t border-border bg-background/60 px-4 py-4">
              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">ID</dt>
                  <dd className="mt-0.5 break-all font-mono text-xs tabular-nums text-foreground">{claim.id}</dd>
                </div>
                {claim.updatedAt && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Updated</dt>
                    <dd className="mt-0.5 font-mono tabular-nums text-foreground">
                      {new Date(claim.updatedAt).toLocaleDateString()}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <EditItemDrawerClientWrapper
        listKey="claims"
        itemId={claim.id}
        open={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
      />
    </>
  );
}
