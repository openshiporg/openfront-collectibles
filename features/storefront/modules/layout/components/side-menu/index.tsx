"use client"

import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";

import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"
import CountrySelect from "../country-select"
import type { StoreRegion } from "@/features/storefront/types/storefront"

type MenuLink = { title: string; href: string }

const SideMenu = ({
  regions,
  categories = [],
  collections = [],
  logo,
}: {
  regions: StoreRegion[] | null
  categories?: MenuLink[]
  collections?: MenuLink[]
  logo: ReactNode
}) => {
  const [open, setOpen] = useState(false);

  const group = (label: string, links: MenuLink[]) =>
    links.length > 0 && (
      <div className="space-y-1">
        <p className="cx-label px-1 pb-1">{label}</p>
        <ul className="cx-band divide-y divide-cx-line overflow-hidden">
          {links.map((link) => (
            <li key={link.href}>
              <LocalizedClientLink
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center px-4 text-[15px] text-cx-ink"
              >
                {link.title}
              </LocalizedClientLink>
            </li>
          ))}
        </ul>
      </div>
    )

  return (
    // TODO: Remove suppressHydrationWarning when React 19.2.0 useId bug is fixed upstream
    // Known issue: https://github.com/radix-ui/primitives/issues/3700
    <div suppressHydrationWarning>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            data-testid="nav-menu-button"
            aria-label="Menu"
            className="-ml-2 inline-flex size-11 items-center justify-center rounded-full text-cx-ink hover:bg-cx-well"
            suppressHydrationWarning
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="flex h-full w-full flex-col gap-0 border-0 bg-cx-bg p-0 sm:max-w-sm"
          data-testid="nav-menu-popup"
        >
          <SheetHeader className="border-b border-cx-line px-4 py-3 text-left">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <SheetDescription className="sr-only">Categories, collections and account</SheetDescription>
            {logo}
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-5">
            {group("Shop", [{ title: "Search", href: "/search" }, { title: "All items", href: "/store" }, { title: "Trade in", href: "/trade-in" }, ...categories])}
            {group("Collections", collections)}
            {group("You", [
              { title: "Account", href: "/account" },
              { title: "Wishlist", href: "/account/wishlist" },
              { title: "Cart", href: "/cart" },
            ])}
            {regions && (
              <div className="mt-auto space-y-1">
                <p className="cx-label px-1 pb-1">Ship to</p>
                <CountrySelect regions={regions} />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default SideMenu
