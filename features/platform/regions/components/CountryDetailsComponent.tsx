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
import { Dot } from "../../components/vault-ui";
import { Country } from "../actions/country-actions";

interface CountryDetailsComponentProps {
  country: Country;
  list: any;
}

export function CountryDetailsComponent({ country, list }: CountryDetailsComponentProps) {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  const statusTone = country.region ? "ok" : "muted";
  const statusText = country.region ? "Assigned" : "Unassigned";

  return (
    <>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={country.id} className="border-0">
          <div className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <Dot tone={statusTone} />
                <Link
                  href={`/dashboard/platform/regions?tab=countries&focus=${country.id}`}
                  className="text-sm font-semibold text-foreground hover:underline"
                >
                  {country.displayName}
                </Link>
                <span className="font-mono text-xs uppercase tabular-nums text-muted-foreground">{country.iso2}</span>
                <span className="text-xs text-muted-foreground">{statusText}</span>
              </div>

              <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="font-mono uppercase tabular-nums">{country.iso3}</span>
                <span className="font-mono tabular-nums">#{country.numCode}</span>
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
                    Edit Country
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
            <div className="border-t border-border bg-background/60 px-4 py-4">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-muted-foreground">Full name</dt>
                  <dd className="mt-0.5 text-foreground">{country.name}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">ISO3</dt>
                  <dd className="mt-0.5 font-mono uppercase tabular-nums text-foreground">{country.iso3}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Numeric code</dt>
                  <dd className="mt-0.5 font-mono tabular-nums text-foreground">{country.numCode}</dd>
                </div>
                {country.region && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Region</dt>
                    <dd className="mt-0.5 text-foreground">
                      {country.region.name}{" "}
                      <span className="font-mono tabular-nums text-muted-foreground">{country.region.currency.code}</span>
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
