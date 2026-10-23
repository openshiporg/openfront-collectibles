"use client";

import { useState } from "react";
import { ListBand } from "../../components/vault-ui";
import { PlatformEmptyState } from "../../components/PlatformEmptyState";
import { PlatformFilterBar } from "../../components/PlatformFilterBar";
import { CurrencyDetailsComponent } from "./CurrencyDetailsComponent";
import { CreateCurrencyDrawer } from "./drawers/CreateCurrencyDrawer";
import { Currency } from "../actions/currency-actions";

interface CurrencyListProps {
  data: {
    items: Currency[];
    count: number;
  };
  statusCounts: Record<string, number>;
  list: any;
}


export function CurrencyList({ data, statusCounts, list }: CurrencyListProps) {
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

  return (
    <div className="space-y-2 px-4 pb-6 md:px-6">
      {/* Filter Bar */}
      <PlatformFilterBar 
        list={list}
        createMode="dropdown"
        onCreateClick={() => setIsCreateDrawerOpen(true)}
        createLabel="Add Currency"
      />


      {data.items.length === 0 ? (
        <PlatformEmptyState title="No currencies" />
      ) : (
        <ListBand>
        {data.items.map((currency) => (
          <CurrencyDetailsComponent
            key={currency.id}
            currency={currency}
            list={list}
          />
        ))}
        </ListBand>
      )}

      {/* Create Drawer */}
      <CreateCurrencyDrawer
        open={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
      />
    </div>
  );
}