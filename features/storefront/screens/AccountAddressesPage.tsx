import { Metadata } from "next"
import { notFound } from "next/navigation"

import AddressBook from "@/features/storefront/modules/account/components/address-book"
import { StorefrontAccountCustomer, StorefrontRegion } from "@/features/storefront/types"

import { getRegion } from "@/features/storefront/lib/data/regions"
import { getUser } from "@/features/storefront/lib/data/user"
import { AccountHeading } from "@/features/storefront/modules/account/components/account-ui"

export const metadata: Metadata = {
  title: "Addresses",
  description: "View your addresses",
}

export async function AccountAddressesPage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const { countryCode } = params
  const customer: StorefrontAccountCustomer | null = await getUser()
  const region: StorefrontRegion | null = await getRegion(countryCode)

  if (!customer || !region) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="addresses-page-wrapper">
      <AccountHeading title="Addresses" />
      <AddressBook customer={customer} region={region} />
    </div>
  )
}
