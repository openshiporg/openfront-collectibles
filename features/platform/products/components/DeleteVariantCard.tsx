import type { PricingRegion, VariantForEditor, OptionValueRenderer } from '../types/variant';
import { Dot } from "@/features/platform/components/vault-ui";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem } from "@/components/ui/accordion";

// Helper to format prices consistently
const formatPrice = (amount: number | null | undefined, locale: string | undefined, currency: string) => {
  if (amount === undefined || amount === null) return "";

  const noDivisionCurrencies = ["jpy", "krw", "vnd"];
  const currencyCode = currency.toUpperCase();
  const isNoDivision = noDivisionCurrencies.includes(currency.toLowerCase());

  return new Intl.NumberFormat(locale || "en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: isNoDivision ? 0 : 2,
    maximumFractionDigits: isNoDivision ? 0 : 2,
  }).format(isNoDivision ? amount : amount / 100);
};

export function DeleteVariantCard({
  variant,
  regions = [],
  onKeepVariant,
  renderOptionValue = (ov) => (
    <Badge
      color="zinc"
      className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums"
    >
      <span className="mr-1 font-sans opacity-70">{ov.option}</span>
      {ov.label}
    </Badge>
  ),
}: { variant: VariantForEditor; regions?: PricingRegion[]; onKeepVariant: () => void; renderOptionValue?: OptionValueRenderer }) {
  return (
    <Accordion type="single" collapsible className="border rounded-lg bg-muted/40">
      <AccordionItem value="details" className="border-0">
        <div className="p-4">
          <div className="flex justify-between">
            <div className="flex gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-background">
                <Package className="h-6 w-6 text-foreground/60" />
              </div>
              <div className="space-y-2">
                <div>
                  <div className="font-mono text-sm font-medium tabular-nums">{variant.title}</div>
                  {Boolean(variant.productOptionValues?.length) && (
                    <div className="flex flex-wrap gap-2">
                      {variant.productOptionValues?.map((ov, i) => (
                        <div key={i}>
                          {renderOptionValue({
                            option: ov.productOption.title,
                            value: ov.value,
                            label: ov.value,
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-0.5">
                  <div className="text-[11px] font-medium text-muted-foreground">
                    Prices
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {regions.map((region) => {
                      const existingPrice = variant.prices?.find(
                        (p) => p.region?.code === region.code
                      );

                      if (existingPrice) {
                        return (
                          <div
                            key={region.code}
                            className="h-6 flex items-center gap-1 px-2 rounded-md text-xs border"
                          >
                            <span className="font-mono uppercase text-[10px] text-muted-foreground mr-0.5">
                              {region.currency.code}
                            </span>
                            <span>
                              {formatPrice(
                                existingPrice.amount,
                                region.locale || "en-US",
                                region.currency.code
                              )}
                            </span>
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={onKeepVariant}
                className="h-8 rounded-full px-3.5 text-xs max-sm:h-10"
              >
                Keep variant
              </Button>
              <span className="mt-4 inline-flex items-baseline gap-1.5 text-xs text-muted-foreground">
                <Dot tone="danger" />
                To be deleted
              </span>
            </div>
          </div>
        </div>

        <AccordionContent className="px-4 pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-3">
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground">
                SKU
              </div>
              <div className="text-sm tabular-nums font-medium">
                {variant.sku || "-"}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground">
                Stock
              </div>
              <div className="text-sm tabular-nums font-medium">
                {variant.inventoryQuantity || "0"}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground">
                Barcode
              </div>
              <div className="text-sm tabular-nums">
                {variant.barcode || "-"}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground">
                EAN
              </div>
              <div className="text-sm tabular-nums">{variant.ean || "-"}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground">
                UPC
              </div>
              <div className="text-sm tabular-nums">{variant.upc || "-"}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground">
                Material
              </div>
              <div className="text-sm">{variant.material || "-"}</div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}