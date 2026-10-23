"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Count, Pill, Track } from "../../components/vault-ui";
import { Region } from "../actions";
import { Country } from "../actions/country-actions";
import { Currency } from "../actions/currency-actions";

// Import the individual components for each tab
import { RegionList } from "./RegionList";
import { CountryList } from "./CountryList";
import { CurrencyList } from "./CurrencyList";

export type TabType = 'regions' | 'countries' | 'currencies';

interface RegionalSettingsTabsProps {
  initialTab?: TabType;
  regionData: {
    items: Region[];
    count: number;
  };
  countryData: {
    items: Country[];
    count: number;
  };
  currencyData: {
    items: Currency[];
    count: number;
  };
  statusCounts: {
    regions: Record<string, number>;
    countries: Record<string, number>;
    currencies: Record<string, number>;
  };
  list: any; // List configuration
}

export function RegionalSettingsTabs({
  initialTab = 'regions',
  regionData,
  countryData,
  currencyData,
  statusCounts,
  list
}: RegionalSettingsTabsProps) {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams() ?? new URLSearchParams();
  
  // Get active tab from URL or use initial
  const activeTab = (searchParams.get('tab') as TabType) || initialTab;
  
  // Handle tab change with URL manipulation
  const handleTabChange = (tab: string) => {
    if (tab !== 'regions' && tab !== 'countries' && tab !== 'currencies') return;
    const params = new URLSearchParams(searchParams.toString());
    
    if (tab === 'regions') {
      // Remove tab param for default tab
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    
    // Keep other params like search, page, etc.
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(newUrl);
  };

  const tabs = [
    { value: 'regions', label: 'Regions', count: regionData.count },
    { value: 'countries', label: 'Countries', count: countryData.count },
    { value: 'currencies', label: 'Currencies', count: currencyData.count },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="px-4 md:px-6">
        <Track label="Regional settings">
          {tabs.map((tab) => (
            <Pill
              key={tab.value}
              active={activeTab === tab.value}
              onClick={() => handleTabChange(tab.value)}
            >
              {tab.label} <Count>{tab.count}</Count>
            </Pill>
          ))}
        </Track>
      </div>

      {activeTab === 'regions' && (
        <RegionList
          data={regionData}
          statusCounts={statusCounts.regions}
          list={list}
        />
      )}

      {activeTab === 'countries' && (
        <CountryList
          data={countryData}
          statusCounts={statusCounts.countries}
          list={list}
        />
      )}

      {activeTab === 'currencies' && (
        <CurrencyList
          data={currencyData}
          statusCounts={statusCounts.currencies}
          list={list}
        />
      )}
    </div>
  );
}
