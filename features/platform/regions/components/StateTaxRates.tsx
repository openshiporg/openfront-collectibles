"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListBand } from "../../components/vault-ui";
import { saveRegionStateTaxRate } from "../actions";

type Rate = { id: string; code: string | null; name: string; rate: number | null };

const percent = (rate: number | null | undefined) =>
  `${(Number(rate || 0) * 100).toFixed(3).replace(/\.?0+$/, "")}%`;

/** State and province sales tax for one region: an order shipping to that state is taxed at its rate. */
export function StateTaxRates({ regionId, regionRate, initialRates }: { regionId: string; regionRate: number; initialRates: Rate[] }) {
  const [rates, setRates] = useState<Rate[]>(initialRates);
  const [code, setCode] = useState("");
  const [rate, setRate] = useState("");
  const [pending, startTransition] = useTransition();

  const save = (nextCode: string, ratePercent: number) =>
    startTransition(async () => {
      const result = await saveRegionStateTaxRate(regionId, { code: nextCode, ratePercent });
      if (!result.success) {
        toast.error(result.error || "Could not save the tax rate");
        return;
      }
      setRates(result.data as Rate[]);
      setCode("");
      setRate("");
      toast.success(ratePercent > 0 ? `${nextCode.toUpperCase()} sales tax saved` : `${nextCode.toUpperCase()} sales tax removed`);
    });

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Orders shipping to a state below are taxed at its rate. Everywhere else in this region: {percent(regionRate)}.
      </p>
      {rates.length > 0 && (
        <ListBand>
          {rates.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="flex min-w-0 items-baseline gap-2.5 text-sm">
                <span className="w-10 shrink-0 font-mono text-xs uppercase tabular-nums text-muted-foreground">{item.code}</span>
                <span className="truncate text-foreground">{item.name}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="font-mono text-sm tabular-nums text-foreground">{percent(item.rate)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-10 sm:h-8"
                  disabled={pending}
                  onClick={() => save(item.code || "", 0)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </ListBand>
      )}
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          save(code, Number(rate));
        }}
      >
        <div className="grid gap-1">
          <Label htmlFor={`tax-code-${regionId}`} className="text-xs">State code</Label>
          <Input
            id={`tax-code-${regionId}`}
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="TX"
            maxLength={10}
            required
            className="h-10 w-24 text-base sm:text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor={`tax-rate-${regionId}`} className="text-xs">Rate (%)</Label>
          <Input
            id={`tax-rate-${regionId}`}
            value={rate}
            onChange={(event) => setRate(event.target.value)}
            placeholder="8.25"
            inputMode="decimal"
            type="number"
            step="0.001"
            min="0"
            max="30"
            required
            className="h-10 w-28 text-base sm:text-sm"
          />
        </div>
        <Button type="submit" className="h-10" disabled={pending || !code || rate === ""}>
          {pending ? "Saving…" : "Save rate"}
        </Button>
      </form>
    </div>
  );
}
