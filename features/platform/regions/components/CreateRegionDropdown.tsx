"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, FileText, Sparkles, ChevronDown } from "lucide-react";
import { platformCreateButtonClass } from "../../components/PlatformFilterBar";
import { cn } from "@/lib/utils";

interface CreateRegionDropdownProps {
  onCreateClick: (mode: 'scratch' | 'popular') => void;
}

export function CreateRegionDropdown({ onCreateClick }: CreateRegionDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          className={cn(platformCreateButtonClass, "gap-1.5")}
        >
          <Plus />
          <span className="hidden lg:inline">Add Region</span>
          <ChevronDown className="hidden lg:inline" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => onCreateClick('scratch')}>
          <FileText className="w-4 h-4 mr-3" />
          <div className="flex flex-col">
            <span className="font-medium">Create from Scratch</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => onCreateClick('popular')}>
          <Sparkles className="w-4 h-4 mr-3" />
          <div className="flex flex-col">
            <span className="font-medium">Add Popular Regions</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}