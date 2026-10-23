import React from "react"
import { StorefrontAccountCustomer, StorefrontRegion } from "@/features/storefront/types"

import AddAddress from "../address-card/add-address"
import EditAddress from "../address-card/edit-address-modal"

type AddressBookProps = {
  customer: StorefrontAccountCustomer
  region: StorefrontRegion
}

const AddressBook: React.FC<AddressBookProps> = ({ customer, region }) => {
  const { addresses } = customer
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span className="cx-num text-[13px] text-cx-ink-3">
          {addresses?.length || 0} saved
        </span>
        <AddAddress region={region} />
      </div>
      {addresses && addresses.length > 0 ? (
        <div className="cx-band divide-y divide-cx-line overflow-hidden">
          {addresses.map((address) => (
            <EditAddress region={region} address={address} key={address.id} />
          ))}
        </div>
      ) : (
        <div className="cx-band px-5 py-8">
          <p className="font-cx-serif text-[20px] leading-[26px] text-cx-ink">No saved addresses</p>
        </div>
      )}
    </div>
  )
}

export default AddressBook
