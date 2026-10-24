import { Metadata } from "next"
import type { StorefrontCustomerProfile, StorefrontRegionBasic } from '@/features/storefront/types'

import ProfilePhone from "@/features/storefront/modules/account/components/profile-phone"
import ProfileBillingAddress from "@/features/storefront/modules/account/components/profile-billing-address"
import ProfileEmail from "@/features/storefront/modules/account/components/profile-email"
import ProfileName from "@/features/storefront/modules/account/components/profile-name"

import { notFound } from "next/navigation"
import { listRegions } from "@/features/storefront/lib/data/regions"
import { getUser } from "@/features/storefront/lib/data/user"
import { AccountHeading } from "@/features/storefront/modules/account/components/account-ui"
import CollectorProfileForm from "@/features/storefront/modules/account/components/collector-profile"
import { getCollectorProfile } from "@/features/storefront/lib/data/collectibles"

export const metadata: Metadata = {
  title: "Profile",
  description: "View and edit your store profile.",
}

export async function AccountProfilePage() {
  const customer: StorefrontCustomerProfile | null = await getUser()
  const { regions }: { regions: StorefrontRegionBasic[] | null } = await listRegions()
  const collectorProfile = await getCollectorProfile()

  if (!customer || !regions) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="profile-page-wrapper">
      <AccountHeading title="Profile" />
      <div className="cx-band divide-y divide-cx-line overflow-hidden">
        <ProfileName customer={customer} />
        <ProfileEmail customer={customer} />
        <ProfilePhone customer={customer} />
        <ProfileBillingAddress customer={customer} regions={regions} />
      </div>
      {collectorProfile !== undefined && (
        <div className="cx-band mt-8 overflow-hidden">
          <CollectorProfileForm profile={collectorProfile} fallbackName={(customer as any)?.name || ""} />
        </div>
      )}
    </div>
  )
}
