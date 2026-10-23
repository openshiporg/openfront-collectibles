"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash } from "lucide-react";
import Link from "next/link";
import { EditItemDrawerClientWrapper } from "../../components/EditItemDrawerClientWrapper";
import { Dot, ListBand, SectionTitle } from "../../components/vault-ui";
import { Currency } from "../actions/currency-actions";

interface CurrencyDetailsComponentProps {
  currency: Currency;
  list: any;
}

export function CurrencyDetailsComponent({ currency, list }: CurrencyDetailsComponentProps) {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  const isActive = currency.regions && currency.regions.length > 0;
  const statusTone = isActive ? "ok" : "muted";
  const statusText = isActive ? "Active" : "Unused";

  return (
    <>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={currency.id} className="border-0">
          <div className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <Dot tone={statusTone} />
                <Link
                  href={`/dashboard/platform/regions?tab=currencies&focus=${currency.id}`}
                  className="text-sm font-semibold text-foreground hover:underline"
                >
                  {currency.name}
                </Link>
                <span className="font-mono text-xs uppercase tabular-nums text-muted-foreground">{currency.code}</span>
                <span className="text-xs text-muted-foreground">{statusText}</span>
              </div>

              <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>Symbol <span className="font-mono tabular-nums text-foreground">{currency.symbol}</span></span>
                {currency.symbolNative !== currency.symbol && (
                  <span>Native <span className="font-mono tabular-nums text-foreground">{currency.symbolNative}</span></span>
                )}
                {currency.regions && currency.regions.length > 0 && (
                  <span>
                    <span className="font-mono tabular-nums">{currency.regions.length}</span> region{currency.regions.length !== 1 ? 's' : ''}
                  </span>
                )}
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
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Currency
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <Trash className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

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
            <div className="space-y-4 border-t border-border bg-background/60 px-4 py-4">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-muted-foreground">Code</dt>
                  <dd className="mt-0.5 font-mono uppercase tabular-nums text-foreground">{currency.code}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Symbol</dt>
                  <dd className="mt-0.5 font-mono tabular-nums text-foreground">{currency.symbol}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Native symbol</dt>
                  <dd className="mt-0.5 font-mono tabular-nums text-foreground">{currency.symbolNative}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Regions</dt>
                  <dd className="mt-0.5 font-mono tabular-nums text-foreground">{currency.regions?.length || 0}</dd>
                </div>
              </dl>

              {currency.regions && currency.regions.length > 0 && (
                <div>
                  <SectionTitle meta={currency.regions.length}>Used by regions</SectionTitle>
                  <ListBand>
                    {currency.regions.map((region) => (
                      <div key={region.id} className="flex items-baseline justify-between gap-3 px-3 py-2 text-sm">
                        <span className="truncate text-foreground">{region.name}</span>
                        <span className="font-mono text-xs uppercase tabular-nums text-muted-foreground">{region.code}</span>
                      </div>
                    ))}
                  </ListBand>
                </div>
              )}
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
