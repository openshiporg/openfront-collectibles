"use client"

import { useState, type ReactNode } from "react"
import { ChevronRight, Menu, X } from "lucide-react"

import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"
import CountrySelect from "../country-select"
import type { StoreRegion } from "@/features/storefront/types/storefront"

export type MenuLink = { title: string; href: string }
export type MenuGroup = { label: string; links: MenuLink[] }

// The phone menu: everything the desktop header shows, plus search and the account links.
const SideMenu = ({ groups, regions, logo }: { groups: MenuGroup[]; regions: StoreRegion[] | null; logo: ReactNode }) => {
  const [open, setOpen] = useState(false)

  return (
    // TODO: Remove suppressHydrationWarning when React 19.2.0 useId bug is fixed upstream
    // Known issue: https://github.com/radix-ui/primitives/issues/3700
    <div className="deneb-menu" suppressHydrationWarning>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button type="button" className="deneb-icon-btn" data-testid="nav-menu-button" aria-label="Menu" suppressHydrationWarning>
            <Menu size={22} aria-hidden="true" />
          </button>
        </SheetTrigger>
        <SheetContent
          side="right"
          data-testid="nav-menu-popup"
          className="deneb-drawer flex w-full max-w-none flex-col gap-0 border-0 p-0 sm:max-w-sm data-[state=closed]:duration-200 data-[state=open]:duration-300 [&>button.absolute]:hidden"
        >
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">Shop, account and shipping country</SheetDescription>
          <div className="deneb-drawer-head">
            <div className="min-w-0" onClick={() => setOpen(false)}>{logo}</div>
            <SheetClose asChild>
              <button type="button" className="deneb-icon-btn" aria-label="Close menu" data-testid="nav-menu-close">
                <X size={22} aria-hidden="true" />
              </button>
            </SheetClose>
          </div>
          <nav className="deneb-drawer-body" aria-label="Menu">
            {groups.filter((group) => group.links.length > 0).map((group) => (
              <section key={group.label}>
                <h2>{group.label}</h2>
                <ul>
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <LocalizedClientLink href={link.href} onClick={() => setOpen(false)}>
                        <span>{link.title}</span>
                        <ChevronRight size={18} aria-hidden="true" />
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            {regions && regions.length > 0 && (
              <section className="deneb-drawer-region">
                <h2>Ship to</h2>
                <CountrySelect regions={regions} />
              </section>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default SideMenu
