import { getCategoriesList } from "@/features/storefront/lib/data/categories"
import { getCollectionsList } from "@/features/storefront/lib/data/collections"
import { listRegions } from "@/features/storefront/lib/data/regions"
import LocalizedClientLink from "@/features/storefront/modules/common/components/localized-client-link"
import Logo from "@/features/storefront/modules/layout/components/logo"
import CountrySelect from "@/features/storefront/modules/layout/components/country-select"
import { getStore } from "@/features/storefront/lib/data/store"
import { getUser } from "@/features/storefront/lib/data/user"

function Column({ title, links }: { title: string; links: { title: string; href: string }[] }) {
  if (!links.length) return null
  return (
    <div className="min-w-0">
      <p className="cx-label !text-[#a39a8a]">{title}</p>
      <ul className="mt-3 space-y-0.5">
        {links.map((link) => (
          <li key={link.href}>
            <LocalizedClientLink
              href={link.href}
              className="inline-flex min-h-9 items-center text-[14px] text-[#d9d1c2] hover:text-white"
            >
              {link.title}
            </LocalizedClientLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default async function Footer() {
  const [{ collections }, { productCategories }, { regions }, store, customer] = await Promise.all([
    getCollectionsList(0, 6),
    getCategoriesList(0, 12),
    listRegions(),
    getStore(),
    getUser().catch(() => null),
  ])
  const storeName = store?.name || "Store"

  const categoryLinks = (productCategories || [])
    .filter((c: any) => !c.parentCategory)
    .slice(0, 8)
    .map((c: any) => ({ title: c.title, href: `/categories/${c.handle}` }))
  const collectionLinks = (collections || []).map((c: any) => ({ title: c.title, href: `/collections/${c.handle}` }))

  return (
    <footer className="mt-auto w-full bg-cx-vault text-[#f3eee3]">
      <div className="mx-auto w-full max-w-[1320px] px-4 pb-10 pt-14 sm:px-6 sm:pt-16">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
          <div className="space-y-5">
            <Logo size="lg" tone="paper" />
            {regions && regions.length > 0 && (
              <div className="max-w-[260px] space-y-1.5">
                <p className="cx-label !text-[#a39a8a]">Ship to</p>
                <CountrySelect regions={regions} />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <Column title="Categories" links={categoryLinks} />
            <Column title="Collections" links={collectionLinks} />
            <Column
              title="Account"
              links={[
                { title: customer ? "Account" : "Sign in", href: "/account" },
                { title: "Orders", href: "/account/orders" },
                { title: "Addresses", href: "/account/addresses" },
                { title: "Cart", href: "/cart" },
              ]}
            />
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-cx-vault-2 pt-5 text-[13px] text-[#a39a8a] sm:flex-row sm:items-center sm:justify-between">
          <p suppressHydrationWarning>
            © {new Date().getFullYear()} {storeName}
          </p>
        </div>
      </div>
    </footer>
  )
}
