import { Suspense } from 'react';

import { listRegions } from '@/features/storefront/lib/data/regions';
import { getCategoriesList } from '@/features/storefront/lib/data/categories';
import { getCollectionsList } from '@/features/storefront/lib/data/collections';

import LocalizedClientLink from '@/features/storefront/modules/common/components/localized-client-link';
import CartButton from '@/features/storefront/modules/layout/components/cart-button';
import SideMenu from '@/features/storefront/modules/layout/components/side-menu';
import Logo from '@/features/storefront/modules/layout/components/logo';
import { ChevronDown, Search } from 'lucide-react';

type NavLinkItem = { title: string; href: string };

export default async function Nav() {
  const [{ regions }, { productCategories }, { collections }] = await Promise.all([
    listRegions(),
    getCategoriesList(0, 12),
    getCollectionsList(0, 6),
  ]);

  const categories: NavLinkItem[] = (productCategories || [])
    .filter((c: any) => !c.parentCategory)
    .map((c: any) => ({ title: c.title, href: `/categories/${c.handle}` }));
  // Up to six categories fit the desktop bar; beyond that the rest go under "More".
  const shown = categories.length > 6 ? categories.slice(0, 5) : categories;
  const overflow = categories.length > 6 ? categories.slice(5) : [];
  const collectionLinks: NavLinkItem[] = (collections || []).map((c: any) => ({
    title: c.title,
    href: `/collections/${c.handle}`,
  }));

  return (
    <div className="sticky inset-x-0 top-0 z-50">
      <header className="bg-cx-vault">
        <nav className="mx-auto flex h-16 w-full max-w-[1320px] items-center gap-2 px-4 sm:gap-4 sm:px-6">
          <div className="flex items-center lg:hidden">
            <SideMenu regions={regions} categories={categories} collections={collectionLinks} logo={<Logo />} />
          </div>

          <div className="flex min-w-0 flex-1 items-center lg:flex-none">
            <Logo />
          </div>

          <ul className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
            <li>
              <LocalizedClientLink
                href="/sets"
                className="inline-flex min-h-10 items-center rounded-[2px] px-3 font-cx-display text-[16px] font-bold text-cx-ink hover:bg-cx-vault-2"
              >
                Sets
              </LocalizedClientLink>
            </li>
            {shown.map((c) => (
              <li key={c.href}>
                <LocalizedClientLink
                  href={c.href}
                  className="inline-flex min-h-10 items-center rounded-[2px] px-3 font-cx-display text-[16px] font-semibold text-cx-ink-2 hover:bg-cx-vault-2 hover:text-cx-ink"
                >
                  {c.title}
                </LocalizedClientLink>
              </li>
            ))}
            {collectionLinks.some((c) => c.href.endsWith('-pre-orders')) && (
              <li>
                <LocalizedClientLink
                  href={collectionLinks.find((c) => c.href.endsWith('-pre-orders'))!.href}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-[2px] px-3 font-cx-display text-[16px] font-semibold text-cx-ink-2 hover:bg-cx-vault-2 hover:text-cx-ink"
                >
                  <span className="size-2 bg-cx-accent" aria-hidden="true" />
                  Pre-orders
                </LocalizedClientLink>
              </li>
            )}
            {overflow.length > 0 && (
              <li className="relative">
                <details className="group/more">
                  <summary className="inline-flex min-h-10 cursor-pointer list-none items-center gap-1 rounded-[2px] px-3 font-cx-display text-[16px] font-semibold text-cx-ink-2 hover:bg-cx-vault-2 hover:text-cx-ink [&::-webkit-details-marker]:hidden">
                    More
                    <ChevronDown className="size-3.5 transition-transform group-open/more:rotate-180" aria-hidden="true" />
                  </summary>
                  <ul className="absolute right-0 top-full mt-2 min-w-48 overflow-hidden rounded-[2px] bg-cx-surface py-1 shadow-[0_24px_48px_-16px_rgb(0_0_0/0.7)]">
                    {overflow.map((c) => (
                      <li key={c.href}>
                        <LocalizedClientLink href={c.href} className="flex min-h-11 items-center px-4 text-[14px] text-cx-ink hover:bg-cx-well">
                          {c.title}
                        </LocalizedClientLink>
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            )}
          </ul>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <LocalizedClientLink
              href="/search"
              aria-label="Search"
              className="inline-flex size-11 items-center justify-center rounded-[2px] text-cx-ink hover:bg-cx-vault-2"
              data-testid="nav-search-link"
            >
              <Search className="size-[18px]" aria-hidden="true" />
            </LocalizedClientLink>
            <LocalizedClientLink
              className="hidden min-h-11 items-center rounded-[2px] px-3 font-cx-display text-[16px] font-semibold text-cx-ink-2 hover:text-cx-ink lg:inline-flex"
              href="/trade-in"
              data-testid="nav-trade-in-link"
            >
              Sell to us
            </LocalizedClientLink>
            <LocalizedClientLink
              className="hidden min-h-11 items-center rounded-[2px] px-3 font-cx-display text-[16px] font-semibold text-cx-ink-2 hover:text-cx-ink lg:inline-flex"
              href="/account"
              data-testid="nav-account-link"
            >
              Account
            </LocalizedClientLink>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="inline-flex min-h-11 items-center gap-2 rounded-[2px] px-3 text-[14px] text-cx-ink"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Cart <span className="cx-num text-[13px] text-cx-ink-3">0</span>
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  );
}
