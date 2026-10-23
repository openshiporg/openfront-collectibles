"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { ListBand, Pill, Track } from "../../components/vault-ui";

export type TabType = 'settings' | 'stores' | 'payment-providers';

interface SystemTabsProps {
  initialTab?: TabType;
  list: any;
}

const tabs: { value: TabType; label: string; title: string; href?: string }[] = [
  { value: 'settings', label: 'Settings', title: 'Store settings', href: '/dashboard/platform/store' },
  { value: 'stores', label: 'Stores', title: 'Store configuration' },
  { value: 'payment-providers', label: 'Payment', title: 'Payment providers', href: '/dashboard/platform/payment-providers' },
];

export function SystemTabs({
  initialTab = 'settings',
  list
}: SystemTabsProps) {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams() ?? new URLSearchParams();

  // Get active tab from URL or use initial
  const activeTab = (searchParams.get('tab') as TabType) || initialTab;

  // Handle tab change with URL manipulation
  const handleTabChange = (tab: string) => {
    if (tab !== 'settings' && tab !== 'stores' && tab !== 'payment-providers') return;
    const params = new URLSearchParams(searchParams.toString());

    if (tab === 'settings') {
      // Remove tab param for default tab
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }

    // Keep other params like search, page, etc.
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(newUrl);
  };

  const current = tabs.find((tab) => tab.value === activeTab) || tabs[0];

  return (
    <div className="space-y-4 px-4 pb-6 md:px-6">
      <Track label="System sections">
        {tabs.map((tab) => (
          <Pill
            key={tab.value}
            active={current.value === tab.value}
            onClick={() => handleTabChange(tab.value)}
          >
            {tab.label}
          </Pill>
        ))}
      </Track>

      <ListBand>
        {current.href ? (
          <Link
            href={current.href}
            className="group flex min-h-11 items-center justify-between gap-4 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-background/60"
          >
            {current.title}
            <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
          </Link>
        ) : (
          <div className="flex min-h-11 items-center px-4 py-3 text-sm text-muted-foreground">
            {current.title}: not configured
          </div>
        )}
      </ListBand>
    </div>
  );
}
