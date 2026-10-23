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

interface CreateCountryDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CreateCountryDrawer({ open, onClose }: CreateCountryDrawerProps) {
  const handleCreate = () => {
    toast.success("Country creation drawer will use EditItemDrawer pattern - similar to region creation");
    onClose();
  };

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent>
        <DrawerHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle>Create Country</DrawerTitle>
              <DrawerDescription className="sr-only">Create country</DrawerDescription>
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
                Country creation is not available here.
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