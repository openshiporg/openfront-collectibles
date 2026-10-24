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

interface Currency {
  id: string;
  name: string;
  code: string;
  symbol: string;
  symbolNative: string;
  noDivisionCurrency: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface CurrencyDetailsComponentProps {
  currency: Currency;
  list: any;
}

export function CurrencyDetailsComponent({
  currency,
  list,
}: CurrencyDetailsComponentProps) {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  return (
    <>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={currency.id} className="border-0">
          <div className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <Link
                  href={`/dashboard/currencies/${currency.id}`}
                  className="text-sm font-semibold text-foreground hover:underline"
                >
                  {currency.name}
                </Link>
                <span className="font-mono text-xs uppercase tabular-nums text-muted-foreground">{currency.code}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>Symbol <span className="font-mono tabular-nums text-foreground">{currency.symbol}</span></span>
                <span className="font-mono tabular-nums">
                  {new Date(currency.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
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
                onClick={() => setIsEditDrawerOpen(true)}
                aria-label="Edit"
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
                  <dd className="mt-0.5 truncate font-mono text-xs tabular-nums text-foreground">{currency.id}</dd>
                </div>
                {currency.updatedAt && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Updated</dt>
                    <dd className="mt-0.5 font-mono tabular-nums text-foreground">
                      {new Date(currency.updatedAt).toLocaleDateString()}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <EditItemDrawerClientWrapper
        listKey="currencies"
        itemId={currency.id}
        open={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
      />
    </>
  );
}
