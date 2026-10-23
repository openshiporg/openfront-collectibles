"use client";

import { useState, useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { X, CheckCircle2, Loader2 } from "lucide-react";
import { Dot, ListBand } from "../../../components/vault-ui";
import { POPULAR_REGIONS } from "../../constants/popular-regions";
import { createPopularRegion } from "../../actions/popular-regions";

interface PopularRegionsDrawerProps {
  open: boolean;
  onClose: () => void;
  onRegionCreated: () => void;
}

export function PopularRegionsDrawer({ 
  open, 
  onClose, 
  onRegionCreated 
}: PopularRegionsDrawerProps) {
  const [creatingRegion, setCreatingRegion] = useState<string | null>(null);
  const [createdRegions, setCreatedRegions] = useState<Set<string>>(new Set());

  const handleCreateRegion = async (templateName: string) => {
    setCreatingRegion(templateName);
    
    try {
      const result = await createPopularRegion(templateName);
      
      if (result.success) {
        toast.success(result.data?.message || `Successfully created ${templateName} region`);
        
        setCreatedRegions(prev => new Set([...prev, templateName]));
        onRegionCreated();
      } else {
        toast.error(result.error || "Failed to create region");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create region");
    } finally {
      setCreatingRegion(null);
    }
  };

  // Reset state when drawer closes
  useEffect(() => {
    if (!open) {
      setCreatedRegions(new Set());
      setCreatingRegion(null);
    }
  }, [open]);

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="text-lg font-semibold tracking-tight">Popular Regions</DrawerTitle>
              <DrawerDescription className="sr-only">Popular regions</DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="size-10 rounded-full" aria-label="Close">
                <X className="w-4 h-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4 pb-6 md:px-6">
          <ListBand>
            {POPULAR_REGIONS.map((template) => {
              const isCreating = creatingRegion === template.name;
              const isCreated = createdRegions.has(template.name);

              return (
                <div
                  key={template.name}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                      <Dot tone={isCreated ? "ok" : "muted"} />
                      <span className="text-sm font-semibold text-foreground">{template.name}</span>
                      {isCreated && <span className="text-xs text-muted-foreground">Created</span>}
                    </div>
                    {template.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
                    )}
                    <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span><span className="font-mono tabular-nums">{template.countries.length}</span> countries</span>
                      <span><span className="font-mono tabular-nums">{template.currencies.length}</span> currencies</span>
                      <span>Tax <span className="font-mono tabular-nums">{template.taxRate}%</span></span>
                      <span>Default <span className="font-mono tabular-nums text-foreground">{template.defaultCurrency}</span></span>
                    </div>
                    <div className="mt-1 font-mono text-xs uppercase tabular-nums text-muted-foreground">
                      {template.countries.slice(0, 4).map((country) => country.iso2).join(" ")}
                      {template.countries.length > 4 && ` +${template.countries.length - 4}`}
                    </div>
                  </div>

                  <Button
                    onClick={() => handleCreateRegion(template.name)}
                    disabled={isCreating || isCreated}
                    size="sm"
                    className={`h-10 shrink-0 rounded-full px-4 sm:h-8 ${isCreated ? "bg-muted text-foreground hover:bg-muted" : ""}`}
                    variant={isCreated ? "secondary" : "default"}
                  >
                    {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {isCreated ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Created
                      </>
                    ) : isCreating ? (
                      "Creating..."
                    ) : (
                      "Create Region"
                    )}
                  </Button>
                </div>
              );
            })}
          </ListBand>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}