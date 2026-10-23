import { Suspense } from 'react';

import { listRegions } from '@/features/storefront/lib/data/regions';
import { getCategoriesList } from '@/features/storefront/lib/data/categories';
import { getCollectionsList } from '@/features/storefront/lib/data/collections';

import LocalizedClientLink from '@/features/storefront/modules/common/components/localized-client-link';
import CartButton from '@/features/storefront/modules/layout/components/cart-button';
import SideMenu from '@/features/storefront/modules/layout/components/side-menu';
import Logo from '@/features/storefront/modules/layout/components/logo';

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
  const collectionLinks: NavLinkItem[] = (collections || []).map((c: any) => ({
    title: c.title,
    href: `/collections/${c.handle}`,
  }));

  return (
    <div className="sticky inset-x-0 top-0 z-50">
      <header className="border-b border-cx-line bg-cx-bg/95 backdrop-blur supports-[backdrop-filter]:bg-cx-bg/85">
        <nav className="mx-auto flex h-16 w-full max-w-[1320px] items-center gap-4 px-4 sm:px-6">
          <div className="flex items-center lg:hidden">
            <SideMenu regions={regions} categories={categories} collections={collectionLinks} logo={<Logo />} />
          </div>

          <div className="flex min-w-0 flex-1 items-center lg:flex-none">
            <Logo />
          </div>

          <ul className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
            <li>
              <LocalizedClientLink
                href="/store"
                className="inline-flex min-h-10 items-center rounded-full px-3 text-[14px] font-medium text-cx-ink hover:bg-cx-well"
              >
                All items
              </LocalizedClientLink>
            </li>
            {categories.slice(0, 6).map((c) => (
              <li key={c.href}>
                <LocalizedClientLink
                  href={c.href}
                  className="inline-flex min-h-10 items-center rounded-full px-3 text-[14px] text-cx-ink-2 hover:bg-cx-well hover:text-cx-ink"
                >
                  {c.title}
                </LocalizedClientLink>
              </li>
            ))}
          </ul>

          <div className="flex shrink-0 items-center gap-1">
            <LocalizedClientLink
              className="hidden min-h-11 items-center rounded-full px-3 text-[14px] text-cx-ink-2 hover:text-cx-ink lg:inline-flex"
              href="/account"
              data-testid="nav-account-link"
            >
              Account
            </LocalizedClientLink>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-[14px] text-cx-ink"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Cart <span className="cx-num text-[12px] text-cx-ink-3">0</span>
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
