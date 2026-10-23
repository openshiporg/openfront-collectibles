"use client";

import { useId } from "react";
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Pill, Track } from "@/features/platform/components/vault-ui";

export function ConvertToTabs() {
  const id = useId();
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams() ?? new URLSearchParams();
  
  const convertTo = searchParams.get('currency') || 'usd';

  const handleConvertToChange = (currency: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('currency', currency);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Track label="Convert to">
      {[
        ["usd", "USD"],
        ["eur", "EUR"],
        ["gbp", "GBP"],
      ].map(([code, label]) => (
        <Pill
          key={code}
          id={`${id}-${code}`}
          active={convertTo === code}
          onClick={() => handleConvertToChange(code)}
          className="font-mono"
        >
          {label}
        </Pill>
      ))}
    </Track>
  );
}
