"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Count, Pill, Track } from "../../components/vault-ui";


interface StatusTabsProps {
  regionCounts: {
    all: number;
    regions: Array<{
      id: string;
      name: string;
      count: number;
    }>;
  };
}

export function StatusTabs({ regionCounts }: StatusTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams()!;
  const pathname = usePathname();
  const regions = regionCounts.regions.map(region => ({
    value: region.id,
    label: region.name,
    count: region.count,
  }));

  // Get current region from URL - region filter
  const regionFilter = searchParams.get("!regions_some");
  let currentRegion = "all";

  if (regionFilter) {
    try {
      const parsed = JSON.parse(decodeURIComponent(regionFilter));
      if (typeof parsed === "object" && parsed.id) {
        currentRegion = parsed.id;
      }
    } catch (e) {
      // Invalid JSON in URL, ignore
    }
  }

  const handleRegionChange = (regionId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Reset to page 1 when changing region
    params.set("page", "1");
    
    if (regionId === "all") {
      params.delete("!regions_some");
    } else {
      params.set("!regions_some", JSON.stringify({ id: regionId }));
    }
    
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="px-4 py-3 md:px-6">
      <Track label="Region">
        <Pill active={currentRegion === "all"} onClick={() => handleRegionChange("all")}>
          All <Count>{regionCounts.all}</Count>
        </Pill>
        {regions.map((region) => (
          <Pill
            key={region.value}
            active={currentRegion === region.value}
            onClick={() => handleRegionChange(region.value)}
          >
            {region.label} <Count>{region.count}</Count>
          </Pill>
        ))}
      </Track>
    </div>
  );
}
