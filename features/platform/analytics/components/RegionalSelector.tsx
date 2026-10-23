'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Region } from '../lib/analyticsHelpers';

interface RegionalSelectorProps {
  regions: Region[];
  selectedRegion?: string;
  className?: string;
}

export function RegionalSelector({ regions, selectedRegion, className }: RegionalSelectorProps) {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams() ?? new URLSearchParams();

  const handleRegionChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value === 'all') {
      params.delete('region');
    } else {
      params.set('region', value);
    }
    
    // Reset to first page when region changes
    params.set('page', '1');
    
    router.push(`${pathname}?${params.toString()}`);
  };

  const getDisplayValue = () => {
    if (!selectedRegion || selectedRegion === 'all') {
      return 'All regions';
    }
    
    const region = regions.find(r => r.code === selectedRegion);
    if (region) {
      return `${region.name} (${region.currency.code.toUpperCase()})`;
    }
    
    return 'Select Region';
  };

  return (
    <Select value={selectedRegion || 'all'} onValueChange={handleRegionChange}>
      <SelectTrigger className={`h-10 rounded-full bg-background ${className ?? ''}`}>
        <SelectValue placeholder="All regions">
          {getDisplayValue()}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          All regions
        </SelectItem>
        {regions.map((region) => (
          <SelectItem key={region.id} value={region.code}>
            <div className="flex items-center gap-2">
              <span>{region.name}</span>
              <span className="font-mono text-muted-foreground">
                {region.currency.code.toUpperCase()}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}