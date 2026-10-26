import { Metadata } from "next"

import type { ShelfParams } from "@/features/storefront/modules/cards/card-shelf"
import StoreTemplate from "@/features/storefront/modules/store/templates"

export const metadata: Metadata = {
  title: "All products",
  description: "Pokémon singles, graded slabs and sealed product.",
}

type Params = {
  searchParams: Promise<ShelfParams>
  params: Promise<{
    countryCode: string
  }>
}

export async function StorePage(props: Params) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  return <StoreTemplate params={searchParams} countryCode={params.countryCode} />
}
