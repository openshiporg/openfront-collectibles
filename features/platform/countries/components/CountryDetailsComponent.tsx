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

interface Country {
  id: string;
  name: string;
  iso2: string;
  iso3: string;
  numCode: number;
  displayName: string;
  region?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt?: string;
}

interface CountryDetailsComponentProps {
  country: Country;
  list: any;
}

export function CountryDetailsComponent({
  country,
  list,
}: CountryDetailsComponentProps) {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  return (
    <>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={country.id} className="border-0">
          <div className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <Link
                  href={`/dashboard/platform/countries/${country.id}`}
                  className="text-sm font-semibold text-foreground hover:underline"
                >
                  {country.name || country.displayName}
                </Link>
                <span className="font-mono text-xs uppercase tabular-nums text-muted-foreground">{country.iso2}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {country.region && <span className="text-foreground">{country.region.name}</span>}
                <span className="font-mono tabular-nums">
                  {new Date(country.createdAt).toLocaleDateString("en-US", {
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
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-muted-foreground">Display name</dt>
                  <dd className="mt-0.5 text-foreground">{country.displayName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">ISO2</dt>
                  <dd className="mt-0.5 font-mono uppercase tabular-nums text-foreground">{country.iso2}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">ISO3</dt>
                  <dd className="mt-0.5 font-mono uppercase tabular-nums text-foreground">{country.iso3}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Region</dt>
                  <dd className="mt-0.5 text-foreground">{country.region?.name || '—'}</dd>
                </div>
                {country.updatedAt && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Updated</dt>
                    <dd className="mt-0.5 font-mono tabular-nums text-foreground">
                      {new Date(country.updatedAt).toLocaleDateString()}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <EditItemDrawerClientWrapper
        listKey="countries"
        itemId={country.id}
        open={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
      />
    </>
  );
}
