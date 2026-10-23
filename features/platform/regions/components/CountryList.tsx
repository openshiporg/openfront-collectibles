"use client";

import { useState } from "react";
import { ListBand } from "../../components/vault-ui";
import { PlatformEmptyState } from "../../components/PlatformEmptyState";
import { PlatformFilterBar } from "../../components/PlatformFilterBar";
import { CountryDetailsComponent } from "./CountryDetailsComponent";
import { CreateCountryDrawer } from "./drawers/CreateCountryDrawer";
import { Country } from "../actions/country-actions";

interface CountryListProps {
  data: {
    items: Country[];
    count: number;
  };
  statusCounts: Record<string, number>;
  list: any;
}


export function CountryList({ data, statusCounts, list }: CountryListProps) {
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

  return (
    <div className="space-y-2 px-4 pb-6 md:px-6">
      {/* Filter Bar */}
      <PlatformFilterBar 
        list={list}
        createMode="dropdown"
        onCreateClick={() => setIsCreateDrawerOpen(true)}
        createLabel="Add Country"
      />


      {data.items.length === 0 ? (
        <PlatformEmptyState title="No countries" />
      ) : (
        <ListBand>
        {data.items.map((country) => (
          <CountryDetailsComponent
            key={country.id}
            country={country}
            list={list}
          />
        ))}
        </ListBand>
      )}

      {/* Create Drawer */}
      <CreateCountryDrawer
        open={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
      />
    </div>
  );
}