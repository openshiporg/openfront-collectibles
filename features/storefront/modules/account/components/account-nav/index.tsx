"use client"

import { LogOut } from "lucide-react"
import { useParams, usePathname } from "next/navigation"
import { useState } from "react"

import { signOut } from "@/features/storefront/lib/data/user"
import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"
import { PillLink, Track } from "@/features/storefront/modules/common/components/collectibles/track"

// Define inline type based on GraphQL User schema
type CustomerInfoForNav = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
};

type AccountNavProps = {
  customer: CustomerInfoForNav | null;
};

const LINKS = [
  { href: "/account", label: "Overview", testId: "overview-link" },
  { href: "/account/orders", label: "Orders", testId: "orders-link" },
  { href: "/account/profile", label: "Profile", testId: "profile-link" },
  { href: "/account/addresses", label: "Addresses", testId: "addresses-link" },
  { href: "/account/binder", label: "Binder", testId: "binder-link" },
  { href: "/account/wishlist", label: "Want list", testId: "wishlist-link" },
  { href: "/account/saved-searches", label: "Saved searches", testId: "saved-searches-link" },
  { href: "/account/trade-ins", label: "Sold to us", testId: "trade-ins-link" },
  { href: "/account/invoicing", label: "Business account", testId: "invoicing-link" },
  { href: "/account/invoices", label: "Invoices", testId: "invoices-link" },
]

const AccountNav = ({ customer }: AccountNavProps) => {
  const params = useParams()
  const route = usePathname() ?? ""
  const [signingOut, setSigningOut] = useState(false)

  if (typeof params?.countryCode !== "string") {
    return null
  }
  const countryCode = params.countryCode
  const current = route.split(`/${countryCode}`)[1] || "/"

  const isActive = (href: string) =>
    href === "/account" ? current === href : current === href || current.startsWith(`${href}/`)

  const handleLogout = async () => {
    setSigningOut(true)
    try {
      await signOut(countryCode)
    } finally {
      setSigningOut(false)
    }
  }

  const name = [customer?.firstName, customer?.lastName].filter(Boolean).join(" ")

  return (
    <div data-testid="account-nav">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          {name && (
            <p className="mt-1 truncate font-cx-display text-[26px] font-bold leading-[32px] tracking-[-0.01em] text-cx-ink sm:text-[32px] sm:leading-[38px]">
              {name}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={signingOut}
          data-testid="logout-button"
          className="inline-flex min-h-11 items-center gap-2 rounded-[2px] px-3 text-[14px] text-cx-ink-2 hover:bg-cx-well hover:text-cx-ink disabled:opacity-50"
        >
          <LogOut className="size-4" aria-hidden="true" />
          {signingOut ? "Signing out" : "Sign out"}
        </button>
      </div>
      {/* Phone: every section in view as a two-column list, no sideways scrolling (S11). */}
      <nav aria-label="Account" className="mt-5 sm:hidden" data-testid="mobile-account-nav">
        <ul className="grid grid-cols-2 border-l border-t border-cx-line">
          {LINKS.map((link) => (
            <li key={link.href} className="border-b border-r border-cx-line">
              <LocalizedClientLink
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                data-testid={link.testId}
                className={`flex min-h-11 items-center px-3 text-[15px] ${isActive(link.href) ? "bg-cx-ink font-semibold text-cx-bg" : "text-cx-ink-2"}`}
              >
                {link.label}
              </LocalizedClientLink>
            </li>
          ))}
        </ul>
      </nav>
      <nav aria-label="Account" className="mt-6 hidden sm:block" data-testid="desktop-account-nav">
        <Track label="Account sections" className="w-full sm:w-auto">
          {LINKS.map((link) => (
            <PillLink
              key={link.href}
              href={link.href}
              active={isActive(link.href)}
              data-testid={`${link.testId}-desktop`}
            >
              {link.label}
            </PillLink>
          ))}
        </Track>
      </nav>
    </div>
  )
}

export default AccountNav
