'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Pill, Track } from '@/features/platform/components/vault-ui';
import { Region } from '../lib/analyticsHelpers';

interface RegionalTabsProps {
  regions: Region[];
  selectedRegion?: string;
  className?: string;
}

export function RegionalTabs({ regions, selectedRegion, className }: RegionalTabsProps) {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams() ?? new URLSearchParams();

  // Get the current conversion currency for "All Regions"
  const conversionCurrency = searchParams.get('currency') || 'usd';

  const handleRegionChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (value === 'all') {
      params.delete('region');
      // Keep the currency conversion setting
      if (!params.has('currency')) {
        params.set('currency', 'usd');
      }
    } else {
      params.set('region', value);
      // Remove currency conversion when selecting specific region
      params.delete('currency');
    }
    
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleCurrencyChange = (currency: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('currency', currency);
    router.push(`${pathname}?${params.toString()}`);
  };

  const currentTab = selectedRegion || 'all';

  // Available currencies for conversion
  const currencies = [
    { code: 'usd', symbol: '$', name: 'USD' },
    { code: 'eur', symbol: '€', name: 'EUR' },
    { code: 'gbp', symbol: '£', name: 'GBP' },
  ];

  return (
    <div className={`flex min-w-0 items-center gap-4 ${className}`}>
      <Track label="Region">
        <Pill active={currentTab === 'all'} onClick={() => handleRegionChange('all')}>
          All regions
        </Pill>
        {regions.map((region) => (
          <Pill
            key={region.code}
            active={currentTab === region.code}
            onClick={() => handleRegionChange(region.code)}
          >
            {region.name}
          </Pill>
        ))}
      </Track>
    </div>
  );
}
