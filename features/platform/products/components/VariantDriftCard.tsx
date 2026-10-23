import { parseMajorToMinor, formatMinorToMajor } from '@/features/lib/minor-units';
import type { PriceFormProps, PriceDraft, VariantForEditor, PendingVariantCardProps, VariantDriftCardProps } from '../types/variant';
import { Dot, Pill, Track } from "@/features/platform/components/vault-ui";
import { Button } from "@/components/ui/button";
import { Package, X, Info, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BadgeButton } from "@/components/ui/badge-button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useState } from "react";

import { DeleteVariantCard } from "./DeleteVariantCard";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";

// Helper functions for price formatting
const formatPrice = (amount: number | null | undefined, locale: string | undefined, currency: string) => {
  if (amount === undefined || amount === null) return '';
  try { return new Intl.NumberFormat(locale || 'en-US', { style: 'currency', currency: currency.toUpperCase() }).format(Number(formatMinorToMajor(amount, currency))); }
  catch { return 'Amount unavailable'; }
};
const convertToStorageAmount = parseMajorToMinor;
const formatDisplayAmount = formatMinorToMajor;

// Price form for pending variants
const PendingPriceForm = ({ region, initialPrice, onSave, onCancel }: PriceFormProps) => {
  const [amount, setAmount] = useState(
    initialPrice?.amount !== undefined && initialPrice.amount !== null
      ? formatDisplayAmount(initialPrice.amount, region.currency.code)
      : ""
  );
  const [compareAmount, setCompareAmount] = useState(
    initialPrice?.compareAmount !== undefined && initialPrice.compareAmount !== null
      ? formatDisplayAmount(initialPrice.compareAmount, region.currency.code)
      : ""
  );

  const [priceError, setPriceError] = useState<string | null>(null);
  const handleSave = () => {
    try {
      setPriceError(null);
    const storageAmount = convertToStorageAmount(amount, region.currency.code);
    const storageCompareAmount = compareAmount
      ? convertToStorageAmount(compareAmount, region.currency.code)
      : null;
    onSave({
      amount: storageAmount,
      compareAmount: storageCompareAmount,
      regionCode: region.code,
      currencyCode: region.currency.code,
    });
  
    } catch (error) { setPriceError(error instanceof Error ? error.message : 'Invalid price'); }
  };
  return (
    <div className="flex flex-col">
      <div className="p-4 border-b bg-muted/40">
        <h3 className="font-medium text-sm mb-1">Set Price (Pending)</h3>
        <p className="text-muted-foreground text-xs">
          {region.name} • {region.currency.code.toUpperCase()}
          {region.taxRate ? ` • ${(region.taxRate * 100).toFixed(0)}% tax` : ""}
          <span className="block mt-1 font-medium">
            This price will be saved when the variant is created
          </span>
        </p>
      </div>
      <div className="p-4 space-y-4">
        {priceError && <p role="alert" className="text-sm text-destructive">{priceError}</p>}
        <div>
          <div className="text-xs mb-2">Price</div>
          <div className="relative">
            <Input
              type="text"
              value={amount}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || /^\d*\.?\d*$/.test(val)) {
                  setAmount(val);
                }
              }}
              className="peer ps-5 pe-10 h-9 font-mono text-sm tabular-nums"
              placeholder="Enter price"
            />
            <span className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-2 text-xs">
              {region.currency.symbolNative}
            </span>
            <span className="text-muted-foreground pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-2 text-xs">
              {region.currency.code.toUpperCase()}
            </span>
          </div>
        </div>
        <div>
          <div className="text-xs mb-2">Compare at Price (Optional)</div>
          <div className="relative">
            <Input
              type="text"
              value={compareAmount}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || /^\d*\.?\d*$/.test(val)) {
                  setCompareAmount(val);
                }
              }}
              className="peer ps-5 pe-10 h-9 font-mono text-sm tabular-nums"
              placeholder="0.00"
            />
            <span className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-2 text-xs">
              {region.currency.symbolNative}
            </span>
            <span className="text-muted-foreground pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-2 text-xs">
              {region.currency.code.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 p-4 border-t bg-muted/40">
        <PopoverClose asChild>
          <Button size="sm" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </PopoverClose>
        <PopoverClose asChild>
          <Button size="sm" onClick={handleSave}>
            Set Price
          </Button>
        </PopoverClose>
      </div>
    </div>
  );
};

// Card component for pending variants
function PendingVariantCard({
  variant,
  onUpdate,
  onDelete,
  regions = [],
  renderOptionValue = (ov) => (
    <Badge
      color="zinc"
      className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums"
    >
      <span className="mr-1 font-sans opacity-70">{ov.option}</span>
      {ov.label}
    </Badge>
  ),
}: PendingVariantCardProps) {
  const [openPriceId, setOpenPriceId] = useState<string | null>(null);
  const [localPrices, setLocalPrices] = useState(variant.prices || []);
  const [isOpen, setIsOpen] = useState(false);
  const [currentVariant, setCurrentVariant] = useState(variant);

  const handlePriceAdd = (priceData: PriceDraft) => {
    const updatedPrices = [...localPrices];
    const existingPriceIndex = updatedPrices.findIndex(
      (p) => p.region?.code === priceData.regionCode
    );

    const newPrice = {
      id:
        existingPriceIndex >= 0
          ? updatedPrices[existingPriceIndex].id
          : `pending-price-${Date.now()}`,
      amount: priceData.amount,
      compareAmount: priceData.compareAmount,
      region: {
        code: priceData.regionCode,
        ...(regions.find((r) => r.code === priceData.regionCode) || {}),
      },
      currency: {
        code: priceData.currencyCode,
        ...(regions.find((r) => r.code === priceData.regionCode)?.currency ||
          {}),
      },
    };

    if (existingPriceIndex >= 0) {
      updatedPrices[existingPriceIndex] = newPrice;
    } else {
      updatedPrices.push(newPrice);
    }

    setLocalPrices(updatedPrices);
    onUpdate({
      ...variant,
      prices: updatedPrices,
    });
    setOpenPriceId(null);
  };

  const handleVariantUpdate = (updatedFields: Partial<VariantForEditor>) => {
    const updatedVariant = { ...currentVariant, ...updatedFields };
    setCurrentVariant(updatedVariant);
    onUpdate(updatedVariant);
  };

  return (
    <div className="rounded-xl border border-dashed border-border bg-background">
      <div className="p-4">
        <div className="flex justify-between">
          <div className="flex gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed bg-background">
              <Package className="h-6 w-6 text-foreground/60" />
            </div>
            <div>
              <div className="font-mono text-sm font-medium tabular-nums">{variant.title}</div>
              <div>
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
              <div className="space-y-0.5 mt-2">
                <div className="text-[11px] font-medium text-muted-foreground">
                  Prices (Pending)
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {regions.map((region) => {
                    const existingPrice = localPrices.find(
                      (p) => p.region?.code === region.code
                    );

                    if (existingPrice) {
                      return (
                        <Popover
                          key={region.code}
                          open={openPriceId === existingPrice.id}
                          onOpenChange={(isOpen) =>
                            setOpenPriceId(isOpen ? existingPrice.id : null)
                          }
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 cursor-pointer flex items-center gap-1 px-2.5 rounded-full font-mono text-xs tabular-nums hover:bg-accent border-dashed"
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
                                {existingPrice.compareAmount && (
                                  <span className="ml-1 line-through opacity-70">
                                    {formatPrice(
                                      existingPrice.compareAmount,
                                      region.locale || "en-US",
                                      region.currency.code
                                    )}
                                  </span>
                                )}
                              </span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-0 bg-card" align="end">
                            <PendingPriceForm
                              region={region}
                              initialPrice={existingPrice}
                              onSave={(data) =>
                                handlePriceAdd({
                                  ...data,
                                  regionCode: region.code,
                                  currencyCode: region.currency.code,
                                })
                              }
                              onCancel={() => setOpenPriceId(null)}
                            />
                          </PopoverContent>
                        </Popover>
                      );
                    }

                    return (
                      <Popover
                        key={region.code}
                        open={openPriceId === region.code}
                        onOpenChange={(isOpen) =>
                          setOpenPriceId(isOpen ? region.code : null)
                        }
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1 border border-dashed px-2.5 rounded-full text-xs"
                          >
                            <span className="font-mono uppercase text-[10px] text-muted-foreground mr-0.5">
                              {region.currency.code}
                            </span>
                            Add
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0 bg-card" align="end">
                          <PendingPriceForm
                            region={region}
                            onSave={(data) =>
                              handlePriceAdd({
                                ...data,
                                regionCode: region.code,
                                currencyCode: region.currency.code,
                              })
                            }
                            onCancel={() => setOpenPriceId(null)}
                          />
                        </PopoverContent>
                      </Popover>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end justify-between">
            <div className="flex gap-1 items-start">
              <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 rounded-full [&_svg]:size-3.5 max-sm:size-10"
                  >
                    <MoreHorizontal />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="flex flex-col">
                    <div className="p-4 border-b">
                      <h3 className="font-medium text-sm mb-1">Edit Variant</h3>
                      <p className="text-muted-foreground text-xs">
                        Update variant properties
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="grid gap-3 h-72 overflow-y-auto p-4">
                        <div>
                          <Label className="text-xs">SKU</Label>
                          <Input
                            value={currentVariant.sku || ""}
                            onChange={(e) =>
                              handleVariantUpdate({ sku: e.target.value })
                            }
                            placeholder="SKU-123"
                            className="mt-1 h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Barcode</Label>
                          <Input
                            value={currentVariant.barcode || ""}
                            onChange={(e) =>
                              handleVariantUpdate({ barcode: e.target.value })
                            }
                            placeholder="123456789"
                            className="mt-1 h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">EAN</Label>
                          <Input
                            value={currentVariant.ean || ""}
                            onChange={(e) =>
                              handleVariantUpdate({ ean: e.target.value })
                            }
                            placeholder="1234567890123"
                            className="mt-1 h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">UPC</Label>
                          <Input
                            value={currentVariant.upc || ""}
                            onChange={(e) =>
                              handleVariantUpdate({ upc: e.target.value })
                            }
                            placeholder="123456789012"
                            className="mt-1 h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Stock</Label>
                          <Input
                            type="number"
                            value={currentVariant.inventoryQuantity || 100}
                            onChange={(e) =>
                              handleVariantUpdate({
                                inventoryQuantity: parseInt(e.target.value),
                              })
                            }
                            className="mt-1 h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Material</Label>
                          <Input
                            value={currentVariant.material || ""}
                            onChange={(e) =>
                              handleVariantUpdate({ material: e.target.value })
                            }
                            placeholder="Cotton, Polyester, etc."
                            className="mt-1 h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 p-4 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button size="sm" onClick={() => setIsOpen(false)}>
                        Save
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onDelete?.(variant)}
                className="size-8 rounded-full [&_svg]:size-4 text-muted-foreground hover:text-destructive max-sm:size-10"
              >
                <X />
              </Button>
            </div>
            <span className="mt-4 inline-flex items-baseline gap-1.5 text-xs text-muted-foreground">
              <Dot tone="ok" />
              Pending
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main VariantDriftCard component
export function VariantDriftCard({
  variantsToCreate,
  variantsToDelete,
  unchangedVariants,
  onRemoveFromCreate,
  onRemoveFromDelete,
  onSaveChanges,
  regions = [],
}: VariantDriftCardProps) {
  // Keep track of local state for pending variants
  const [localVariants, setLocalVariants] = useState(variantsToCreate);

  // Set default tab based on what changes exist
  const getDefaultTab = () => {
    if (variantsToCreate.length > 0) return "added";
    if (variantsToDelete.length > 0) return "removed";
    if (unchangedVariants.length > 0) return "unchanged";
    return "added";
  };

  const [activeTab, setActiveTab] = useState(getDefaultTab());

  const handleVariantUpdate = (updatedVariant: any) => {
    const newVariants = localVariants.map((v: any) =>
      v.id === updatedVariant.id ? updatedVariant : v
    );
    setLocalVariants(newVariants);
  };

  const handleRemoveVariant = (variant: any) => {
    const newVariants = localVariants.filter((v: any) => v.id !== variant.id);
    setLocalVariants(newVariants);
    onRemoveFromCreate(variant.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Track label="Variant changes">
          {localVariants.length > 0 && (
            <Pill active={activeTab === "added"} onClick={() => setActiveTab("added")}>
              <Dot tone="ok" className="translate-y-0" />
              <span className="font-mono tabular-nums">{localVariants.length}</span> added
            </Pill>
          )}
          {variantsToDelete.length > 0 && (
            <Pill active={activeTab === "removed"} onClick={() => setActiveTab("removed")}>
              <Dot tone="danger" className="translate-y-0" />
              <span className="font-mono tabular-nums">{variantsToDelete.length}</span> removed
            </Pill>
          )}
          {unchangedVariants.length > 0 && (
            <Pill active={activeTab === "unchanged"} onClick={() => setActiveTab("unchanged")}>
              <Dot tone="muted" className="translate-y-0" />
              <span className="font-mono tabular-nums">{unchangedVariants.length}</span> unchanged
            </Pill>
          )}
        </Track>
        <Button
          onClick={() => onSaveChanges(localVariants)}
          size="sm"
          className="h-9 rounded-full px-4 max-sm:h-10"
        >
          Accept
        </Button>
      </div>
      <div>
          {/* Tab Content */}
          {localVariants.length > 0 && activeTab === "added" && (
            <div>
              <div className="space-y-3">
                {localVariants.map((variant: any) => (
                  <PendingVariantCard
                    key={variant.id}
                    variant={variant}
                    regions={regions}
                    onDelete={handleRemoveVariant}
                    onUpdate={handleVariantUpdate}
                  />
                ))}
              </div>
            </div>
          )}

          {variantsToDelete.length > 0 && activeTab === "removed" && (
            <div>
              <div className="space-y-3">
                {variantsToDelete.map((variant: any) => (
                  <DeleteVariantCard
                    key={variant.id}
                    variant={variant}
                    regions={regions}
                    onKeepVariant={() => onRemoveFromDelete(variant.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {unchangedVariants.length > 0 && activeTab === "unchanged" && (
            <div>
              <div className="space-y-3">
                {unchangedVariants.map((variant: any) => (
                  <div
                    key={variant.id}
                    className="rounded-xl bg-background p-4 ring-1 ring-border"
                  >
                    <div className="flex gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-background">
                        <Package className="h-6 w-6 text-foreground/60" />
                      </div>
                      <div className="space-y-2">
                        <div className="font-mono text-sm font-medium tabular-nums">
                          {variant.title}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {variant.productOptionValues?.map(
                            (ov: any, i: number) => (
                              <Badge
                                key={i}
                                color="zinc"
                                className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums"
                              >
                                <span className="mr-1 font-sans opacity-70">
                                  {ov.productOption.title}
                                </span>
                                {ov.value}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}