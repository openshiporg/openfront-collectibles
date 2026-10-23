"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageContainer } from "../../../dashboard/components/PageContainer";
import { Pagination } from "../../../dashboard/components/Pagination";
import { PlatformFilterBar, platformCreateButtonClass } from "../../components/PlatformFilterBar";
import { PlatformEmptyState } from "../../components/PlatformEmptyState";
import { ListBand, PageTitle } from "../../components/vault-ui";
import { StatusTabs } from "../components/StatusTabs";
import { ShippingOptionDetailsComponent } from "../components/ShippingOptionDetailsComponent";
import { CreateItemDrawerClientWrapper } from "../../components/CreateItemDrawerClientWrapper";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useListItemsQuery } from "../../../dashboard/hooks/useListItems.query";
import { buildOrderByClause } from "../../../dashboard/lib/buildOrderByClause";
import { buildWhereClause } from "../../../dashboard/lib/buildWhereClause";
import { useSelectedFields } from "../../../dashboard/hooks/useSelectedFields";
import { useSort } from "../../../dashboard/hooks/useSort";

interface ShippingOption {
  id: string;
  name: string;
  uniqueKey: string;
  priceType: 'flat_rate' | 'calculated' | 'free';
  amount?: number;
  isReturn: boolean;
  adminOnly: boolean;
  region?: {
    id: string;
    name: string;
    code: string;
    currency: {
      code: string;
      symbol: string;
    };
  };
  fulfillmentProvider?: {
    id: string;
    name: string;
    code: string;
  };
  shippingProfile?: {
    id: string;
    name: string;
  };
  calculatedAmount?: string;
  createdAt: string;
  updatedAt?: string;
}

interface ShippingOptionListPageClientProps {
  list: any;
  initialData: {
    items: ShippingOption[];
    count: number;
  };
  initialError?: string | null;
  initialSearchParams: {
    page: number;
    pageSize: number;
    search: string;
  };
  regionCounts: {
    all: number;
    regions: Array<{
      id: string;
      name: string;
      count: number;
    }>;
  };
}

export function ShippingOptionListPageClient({
  list,
  initialData,
  initialError,
  initialSearchParams,
  regionCounts,
}: ShippingOptionListPageClientProps) {
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const searchParams = useSearchParams() ?? new URLSearchParams();

  // Hooks for sorting and field selection
  const selectedFields = useSelectedFields(list);
  const sort = useSort(list);

  // Extract current search params (reactive to URL changes)
  const currentSearchParams = useMemo(() => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }, [searchParams]);

  const currentPage = parseInt(currentSearchParams.page || '1', 10) || 1;
  const pageSize = parseInt(currentSearchParams.pageSize || list.pageSize?.toString() || '50', 10);
  const searchString = currentSearchParams.search || '';

  // Build query variables from current search params
  const variables = useMemo(() => {
    const orderBy = buildOrderByClause(list, currentSearchParams);
    const filterWhere = buildWhereClause(list, currentSearchParams);
    const searchParameters = searchString ? { search: searchString } : {};
    const searchWhere = buildWhereClause(list, searchParameters);

    // Combine search and filters
    const whereConditions = [];
    if (Object.keys(searchWhere).length > 0) {
      whereConditions.push(searchWhere);
    }
    if (Object.keys(filterWhere).length > 0) {
      whereConditions.push(filterWhere);
    }

    const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

    return {
      where,
      take: pageSize,
      skip: (currentPage - 1) * pageSize,
      orderBy
    };
  }, [list, currentSearchParams, currentPage, pageSize, searchString]);

  // For shipping-options, use raw GraphQL string to include relationship fields (from working repomix)
  const querySelectedFields = `
    id
    name
    uniqueKey
    priceType
    amount
    isReturn
    adminOnly
    region {
      id
      name
      code
      currency {
        code
        symbol
      }
    }
    fulfillmentProvider {
      id
      name
      code
    }
    shippingProfile {
      id
      name
    }
    calculatedAmount
    createdAt
    updatedAt
  `;

  // Use React Query hook with server-side initial data
  // Use React Query hook with server-side initial data
  const { data: queryData, error: queryError, isLoading, isFetching } = useListItemsQuery(
    {
      listKey: list.key,
      variables,
      selectedFields: querySelectedFields
    },
    {
      initialData: initialError ? undefined : initialData,
    }
  );

  // Use query data, fallback to initial data
  const data = queryData || initialData;
  const error = queryError ? queryError.message : initialError;

  if (error) {
    return (
      <PageContainer title="Shipping Options" header={<PageTitle title="Shipping Options" />}>
        <div className="px-4 md:px-6">
          <Alert variant="destructive">
            <AlertDescription>Error loading shipping options: {error}</AlertDescription>
          </Alert>
        </div>
      </PageContainer>
    );
  }

  return (
    <>
      <PageContainer title="Shipping Options" header={<PageTitle title="Shipping Options" />}>
        <div>
          {/* Filter Bar */}
          <div className="px-4 md:px-6">
            <PlatformFilterBar 
              list={list}
              customCreateButton={
                <Button 
                  onClick={() => setIsCreateDrawerOpen(true)}
                  size="icon"
                  className={platformCreateButtonClass}
                >
                  <Plus />
                  <span className="sr-only lg:not-sr-only lg:whitespace-nowrap">
                    Create Shipping Option
                  </span>
                </Button>
              }
            />
          </div>

          {/* Status Tabs */}
          <StatusTabs regionCounts={regionCounts} />

          {/* Shipping Options List */}
          <div className="px-4 md:px-6 pb-6">
            {initialData.items.length > 0 ? (
              <ListBand>
                {initialData.items.map((shippingOption) => (
                  <ShippingOptionDetailsComponent
                    key={shippingOption.id}
                    shippingOption={shippingOption}
                    list={list}
                  />
                ))}
              </ListBand>
            ) : (
              <PlatformEmptyState title="No shipping options" />
            )}
          </div>

          {/* Pagination */}
          {initialData.count > initialSearchParams.pageSize && (
            <div className="px-4 md:px-6">
              <Pagination
                currentPage={initialSearchParams.page}
                total={initialData.count}
                pageSize={initialSearchParams.pageSize}
              />
            </div>
          )}
        </div>
      </PageContainer>

      {/* Create Shipping Option Drawer */}
      <CreateItemDrawerClientWrapper
        listKey="shipping-options"
        open={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        onCreate={() => {
          setIsCreateDrawerOpen(false);
          // Page will refresh automatically
        }}
      />
    </>
  );
}