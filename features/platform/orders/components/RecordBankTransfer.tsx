"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmManualPaymentAction } from "../actions/orders";

export function RecordBankTransfer({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reference.trim()) return;
    setSaving(true);
    const result = await confirmManualPaymentAction(orderId, reference.trim());
    setSaving(false);
    if (!result.success) {
      toast.error(result.error || "Could not record the payment");
      return;
    }
    toast.success("Payment recorded");
    setReference("");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1 space-y-1.5">
        <Label htmlFor={`transfer-reference-${orderId}`} className="text-xs text-muted-foreground">
          Transfer reference
        </Label>
        <Input
          id={`transfer-reference-${orderId}`}
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          maxLength={200}
          autoComplete="off"
        />
      </div>
      <button
        type="submit"
        disabled={saving || !reference.trim()}
        className="inline-flex min-h-9 items-center justify-center rounded-full bg-foreground px-4 text-sm font-medium text-background disabled:opacity-50"
      >
        {saving ? "Recording…" : "Record payment received"}
      </button>
    </form>
  );
}
