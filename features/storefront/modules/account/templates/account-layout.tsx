import React from "react"

import AccountNav from "../components/account-nav"
// Removed HttpTypes import

// Define inline type based on GraphQL User schema
type CustomerInfoForLayout = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  // Add other fields if needed by AccountNav or children
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
    <div className="flex-1 sm:py-12" data-testid="account-page">
      <div className="flex-1 w-full px-6 h-full max-w-5xl mx-auto bg-background flex flex-col">
        {isAuthView ? (
          // Login/Register view - centered layout
          <div className="flex-1 flex items-center justify-center py-12">
            {children}
          </div>
        ) : (
          // Dashboard view - grid layout with nav
          <div className="grid grid-cols-1 sm:grid-cols-[240px_1fr] py-12">
            <div>
              <AccountNav customer={customer} />
            </div>
            <div className="flex-1">{children}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AccountLayout
