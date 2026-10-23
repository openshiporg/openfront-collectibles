import React from "react"

import AccountNav from "../components/account-nav"

// Define inline type based on GraphQL User schema
type CustomerInfoForLayout = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
};

interface AccountLayoutProps {
  customer: CustomerInfoForLayout | null;
  children: React.ReactNode;
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  // If there's no customer, we're in the login/register view
  const isAuthView = !customer;

  return (
    <div className="flex-1" data-testid="account-page">
      {isAuthView ? (
        <div className="mx-auto flex w-full max-w-[1320px] justify-center px-4 py-12 sm:px-6 sm:py-20">
          {children}
        </div>
      ) : (
        <div className="mx-auto w-full max-w-[1120px] px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
          <AccountNav customer={customer} />
          <div className="mt-8 min-w-0">{children}</div>
        </div>
      )}
    </div>
  )
}

export default AccountLayout
