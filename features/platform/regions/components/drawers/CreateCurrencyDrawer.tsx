"use client";

import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { toast } from "sonner";
import { ListBand } from "../../../components/vault-ui";

interface CreateCurrencyDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CreateCurrencyDrawer({ open, onClose }: CreateCurrencyDrawerProps) {
  const handleCreate = () => {
    toast.success("Currency creation drawer will use EditItemDrawer pattern - similar to region creation");
    onClose();
  };

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent>
        <DrawerHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle>Create Currency</DrawerTitle>
              <DrawerDescription className="sr-only">Create currency</DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="size-10 rounded-full" aria-label="Close">
                <X className="w-4 h-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="px-4 pb-6 md:px-6">
          <div className="mx-auto max-w-md space-y-4">
            <ListBand>
              <div className="px-4 py-4 text-sm text-muted-foreground">
                Currency creation is not available here.
              </div>
            </ListBand>
            <Button onClick={handleCreate} className="h-10 w-full rounded-full">
              Continue
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}