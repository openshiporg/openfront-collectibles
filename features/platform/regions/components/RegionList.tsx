"use client";

import { useState } from "react";
import { ListBand } from "../../components/vault-ui";
import { PlatformEmptyState } from "../../components/PlatformEmptyState";
import { PlatformFilterBar } from "../../components/PlatformFilterBar";
import { RegionDetailsComponent } from "./RegionDetailsComponent";
import { CreateItemDrawerClientWrapper } from "@/features/platform/components/CreateItemDrawerClientWrapper";
import { PopularRegionsDrawer } from "./drawers/PopularRegionsDrawer";
import { CreateRegionDropdown } from "./CreateRegionDropdown";
import { Region } from "../actions";

interface RegionListProps {
  data: {
    items: Region[];
    count: number;
  };
  statusCounts: Record<string, number>;
  list: any;
}


export function RegionList({ data, statusCounts, list }: RegionListProps) {
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [isPopularRegionsOpen, setIsPopularRegionsOpen] = useState(false);
  const [createMode, setCreateMode] = useState<'scratch' | 'popular'>('scratch');

  const handleCreateClick = (mode: 'scratch' | 'popular') => {
    setCreateMode(mode);
    if (mode === 'popular') {
      setIsPopularRegionsOpen(true);
    } else {
      setIsCreateDrawerOpen(true);
    }
  };

  const handlePopularRegionCreated = () => {
    setIsPopularRegionsOpen(false);
    // Data will refresh automatically via revalidation
  };

  return (
    <div className="space-y-2 px-4 pb-6 md:px-6">
      {/* Filter Bar with Custom Create Button */}
      <PlatformFilterBar 
        list={list}
        customCreateButton={
          <CreateRegionDropdown onCreateClick={handleCreateClick} />
        }
      />


      {data.items.length === 0 ? (
        <PlatformEmptyState title="No regions" />
      ) : (
        <ListBand>
        {data.items.map((region) => (
          <RegionDetailsComponent
            key={region.id}
            region={region}
            list={list}
          />
        ))}
        </ListBand>
      )}

      {/* Create Drawers */}
      <CreateItemDrawerClientWrapper
        listKey="regions"
        open={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        onCreate={() => {
          window.location.reload();
        }}
      />

      <PopularRegionsDrawer
        open={isPopularRegionsOpen}
        onClose={() => setIsPopularRegionsOpen(false)}
        onRegionCreated={handlePopularRegionCreated}
      />
    </div>
  );
}