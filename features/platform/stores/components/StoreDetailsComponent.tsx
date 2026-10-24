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
import { EditItemDrawerClientWrapper } from "../../components/EditItemDrawerClientWrapper";

interface Store {
  id: string;
  name: string;
  defaultCurrencyCode: string;
  metadata?: any;
  createdAt: string;
  updatedAt?: string;
}

interface StoreDetailsComponentProps {
  store: Store;
  list: any;
}

export function StoreDetailsComponent({
  store,
  list,
}: StoreDetailsComponentProps) {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  return (
    <>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={store.id} className="border-0">
          <div className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <Link
                  href={`/dashboard/stores/${store.id}`}
                  className="text-sm font-semibold text-foreground hover:underline"
                >
                  {store.name}
                </Link>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {store.defaultCurrencyCode?.toUpperCase() || 'USD'}
                </span>
              </div>
              <div className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">
                {new Date(store.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
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
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-muted-foreground">Default currency</dt>
                  <dd className="mt-0.5 font-mono tabular-nums text-foreground">{store.defaultCurrencyCode || 'USD'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Created</dt>
                  <dd className="mt-0.5 font-mono tabular-nums text-foreground">
                    {new Date(store.createdAt).toLocaleDateString()}
                  </dd>
                </div>
                {store.updatedAt && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Updated</dt>
                    <dd className="mt-0.5 font-mono tabular-nums text-foreground">
                      {new Date(store.updatedAt).toLocaleDateString()}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <EditItemDrawerClientWrapper
        listKey="stores"
        itemId={store.id}
        open={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
      />
    </>
  );
}
