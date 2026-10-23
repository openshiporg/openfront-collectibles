"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { XIcon, ChevronDown } from "lucide-react";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { createApiKey } from "../actions/getApiKeys";
import { platformCreateButtonClass } from "../../components/PlatformFilterBar";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Client-side token generation
function generateApiKeyToken(): string {
  // Generate a secure API key token in the browser
  const prefix = 'of_';
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  
  // Convert to base62 (alphanumeric) for readability
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < randomBytes.length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  
  return prefix + result;
}

export interface Option {
  value: string;
  label: string;
}

// Define API key scopes as options
const scopeOptions: Option[] = [
  { value: "read_products", label: "read_products" },
  { value: "write_products", label: "write_products" },
  { value: "read_orders", label: "read_orders" },
  { value: "write_orders", label: "write_orders" },
  { value: "read_customers", label: "read_customers" },
  { value: "write_customers", label: "write_customers" },
  { value: "read_fulfillments", label: "read_fulfillments" },
  { value: "write_fulfillments", label: "write_fulfillments" },
  { value: "read_checkouts", label: "read_checkouts" },
  { value: "write_checkouts", label: "write_checkouts" },
  { value: "read_discounts", label: "read_discounts" },
  { value: "write_discounts", label: "write_discounts" },
  { value: "read_gift_cards", label: "read_gift_cards" },
  { value: "write_gift_cards", label: "write_gift_cards" },
  { value: "read_returns", label: "read_returns" },
  { value: "write_returns", label: "write_returns" },
  { value: "read_sales_channels", label: "read_sales_channels" },
  { value: "write_sales_channels", label: "write_sales_channels" },
  { value: "read_payments", label: "read_payments" },
  { value: "write_payments", label: "write_payments" },
  { value: "read_webhooks", label: "read_webhooks" },
  { value: "write_webhooks", label: "write_webhooks" },
  { value: "read_apps", label: "read_apps" },
  { value: "write_apps", label: "write_apps" },
];

function ScopesMultiSelect({
  value = [],
  onChange,
  options = [],
  placeholder = "Select scopes for this API key",
  isDisabled = false,
}: {
  value?: Option[];
  onChange?: (options: Option[]) => void;
  options?: Option[];
  placeholder?: string;
  isDisabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const commandRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        commandRef.current &&
        !commandRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (option: Option) => {
      if (!value.some((v) => v.value === option.value)) {
        const newValue = [...value, option];
        onChange?.(newValue);
      }
      setInputValue("");
    },
    [value, onChange]
  );

  const handleRemove = useCallback(
    (optionToRemove: Option) => {
      const newValue = value.filter((v) => v.value !== optionToRemove.value);
      onChange?.(newValue);
    },
    [value, onChange]
  );

  const handleClearAll = useCallback(() => {
    onChange?.([]);
  }, [onChange]);

  // Filter out selected options and by input value
  const filteredOptions = options.filter(
    (option) => !value.some((v) => v.value === option.value) &&
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="relative" ref={commandRef}>
      <div
        className={cn(
          "ring-offset-background focus-within:ring-ring flex min-h-11 w-full items-center justify-between rounded-xl bg-muted px-4 py-2 shadow-[inset_0_1px_2px_rgb(0_0_0/0.06)] focus-within:ring-2 focus-within:ring-offset-2 text-left",
          isDisabled && "cursor-not-allowed opacity-50"
        )}
        onClick={() => {
          if (!isDisabled) {
            setOpen(true);
            inputRef.current?.focus();
          }
        }}
      >
        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
          {value.map((option) => (
            <div
              key={option.value}
              className="animate-fadeIn bg-background text-foreground relative inline-flex h-7 cursor-default items-center rounded-full ps-2.5 pe-7 font-mono text-xs font-medium shadow-[0_1px_2px_rgb(0_0_0/0.12)] dark:bg-zinc-800 transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 max-w-full"
            >
              <span className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]">{option.label}</span>
              {!isDisabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(option);
                  }}
                  className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute -inset-y-px -end-px flex size-7 items-center justify-center rounded-e-full border border-transparent p-0 outline-hidden transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          <input
            ref={inputRef}
            disabled={isDisabled}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className={cn(
              "placeholder:text-muted-foreground flex-1 bg-transparent outline-none",
              value.length === 0 ? "w-full" : "w-20"
            )}
            placeholder={value.length === 0 ? placeholder : ""}
          />
        </div>
        <div className="flex items-center gap-1">
          {value.length > 0 && !isDisabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClearAll();
              }}
              className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex size-7 items-center justify-center rounded-md border border-transparent transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </div>
      </div>
      {open && (
        <div className="absolute z-10 mt-1 w-full max-w-[400px]">
          <Command className="border-input rounded-md border bg-popover shadow-md">
            <CommandList className="max-h-48">
              <>
                {filteredOptions.length === 0 ? (
                  <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                    {inputValue.length > 0 ? (
                      <>No results found for "{inputValue}"</>
                    ) : (
                      <>All options have been selected</>
                    )}
                  </CommandEmpty>
                ) : (
                  <CommandGroup>
                    {filteredOptions.map((option) => (
                      <div className="px-1 py-0.5" key={option.value}>
                        <div 
                          onClick={() => handleSelect(option)}
                          className="relative cursor-pointer rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                        >
                          <div className="flex-1 whitespace-normal break-words overflow-visible min-w-0 pr-2">
                            {option.label}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CommandGroup>
                )}
              </>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}

export function CreateApiKey() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [createdToken, setCreatedToken] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    scopes: [] as Option[],
    expiresAt: "",
  });

  const router = useRouter();

  const handleScopeChange = (scopes: Option[]) => {
    setFormData(prev => ({
      ...prev,
      scopes: scopes
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Please enter a name for your API key");
      return;
    }

    if (formData.scopes.length === 0) {
      toast.error("Please select at least one scope");
      return;
    }

    setLoading(true);

    try {
      // Generate token client-side
      const generatedToken = generateApiKeyToken();
      
      const result = await createApiKey({
        name: formData.name,
        scopes: formData.scopes.map(scope => scope.value),
        expiresAt: formData.expiresAt || undefined,
        tokenSecret: generatedToken, // Pass the generated token to be hashed
      });

      if (result.success) {
        // Show the generated token (this is the only time it will be visible)
        setCreatedToken(generatedToken);
        setShowToken(true);
        toast.success("API key created successfully!");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to create API key");
      }
    } catch (error) {
      console.error("Error creating API key:", error);
      toast.error("Failed to create API key");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setShowToken(false);
    setCreatedToken("");
    setFormData({
      name: "",
      scopes: [] as Option[],
      expiresAt: "",
    });
  };

  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(createdToken);
        toast.success("API key copied to clipboard!");
      } else {
        // Fallback for mobile and older browsers
        const textArea = document.createElement("textarea");
        textArea.value = createdToken;
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            toast.success("API key copied to clipboard!");
          } else {
            throw new Error('Copy failed');
          }
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      console.error('Failed to copy:', error);
      // Final fallback - show the token in an alert for mobile
      if (typeof window !== 'undefined' && 'navigator' in window && 'userAgent' in window.navigator) {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
          // For mobile, create a temporary input and try to select it
          const input = document.createElement('input');
          input.value = createdToken;
          input.style.position = 'fixed';
          input.style.top = '0';
          input.style.left = '0';
          input.style.opacity = '0';
          input.style.pointerEvents = 'none';
          document.body.appendChild(input);
          input.focus();
          input.select();
          input.setSelectionRange(0, 99999); // For mobile devices
          
          toast.success("API key selected - press Ctrl+C (or Cmd+C) to copy");
          
          setTimeout(() => {
            document.body.removeChild(input);
          }, 3000);
        } else {
          toast.error("Unable to copy automatically. Please copy manually.");
        }
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset all state when dialog is closed
        setShowToken(false);
        setCreatedToken("");
        setFormData({
          name: "",
          scopes: [] as Option[],
          expiresAt: "",
        });
      }
    }}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          className={platformCreateButtonClass}
        >
          <Plus />
          <span className="hidden lg:inline">Create API Key</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        {!showToken ? (
          <>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription className="sr-only">
                Name, scopes and expiration
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Production bot"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label>
                    Scopes <span className="text-destructive">*</span>
                  </Label>
                  <ScopesMultiSelect
                    value={formData.scopes}
                    options={scopeOptions}
                    onChange={handleScopeChange}
                    placeholder="Select scopes for this API key"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="expiresAt">Expiration (optional)</Label>
                  <DateTimePicker
                    value={formData.expiresAt}
                    onChange={(value) => setFormData(prev => ({ ...prev, expiresAt: value }))}
                    placeholder="Set expiration date and time"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" className="h-10 rounded-full bg-muted px-4" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="h-10 rounded-full px-4">
                  {loading ? "Creating..." : "Create API Key"}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>API Key Created</DialogTitle>
              <DialogDescription>
                Shown once. Copy it now.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <div className="flex items-center gap-2 rounded-full bg-muted py-1 pl-4 pr-1 shadow-[inset_0_1px_2px_rgb(0_0_0/0.06)]">
                  <span className="text-xs font-medium text-muted-foreground">Key</span>
                  <span className="min-w-0 flex-1 truncate font-mono text-sm tabular-nums text-foreground">
                    {createdToken}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-10 shrink-0 rounded-full bg-background shadow-[0_1px_2px_rgb(0_0_0/0.12)] sm:size-8 dark:bg-zinc-800"
                    onClick={copyToClipboard}
                  >
                    <Copy className="size-4" />
                    <span className="sr-only">Copy API Key</span>
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleClose} className="h-10 rounded-full px-4">
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}