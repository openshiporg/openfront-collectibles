import { Suspense } from 'react'
import LocalizedClientLink from '@/features/storefront/modules/common/components/localized-client-link'
import CartButton from '@/features/storefront/modules/layout/components/cart-button'
import Logo from '@/features/storefront/modules/layout/components/logo'
import SideMenu, { type MenuGroup } from '@/features/storefront/modules/layout/components/side-menu'
import { listRegions } from '@/features/storefront/lib/data/regions'
import { getUser } from '@/features/storefront/lib/data/user'
import { Search } from 'lucide-react'

const SHOP_LINKS = [
  { title: 'Singles', href: '/store?kind=raw' },
  { title: 'Sets', href: '/sets' },
  { title: 'Sealed', href: '/store?kind=sealed' },
  { title: 'Graded', href: '/store?kind=graded' },
  { title: 'Buylist', href: '/trade-in' },
]

export default async function Nav() {
  const [customer, regionData] = await Promise.all([
    getUser().catch(() => null),
    listRegions().catch(() => ({ regions: null })),
  ])
  const regions = regionData?.regions ?? null
  const groups: MenuGroup[] = [
    { label: 'Shop', links: [{ title: 'Home', href: '/' }, { title: 'Search', href: '/search' }, ...SHOP_LINKS.slice(0, 4), { title: 'Sell to us', href: '/trade-in' }] },
    {
      label: 'Account',
      links: customer
        ? [{ title: 'Your account', href: '/account' }, { title: 'Orders', href: '/account/orders' }, { title: 'Want list', href: '/account/wishlist' }, { title: 'Sold to us', href: '/account/trade-ins' }, { title: 'Cart', href: '/cart' }]
        : [{ title: 'Sign in or create account', href: '/account' }, { title: 'Cart', href: '/cart' }],
    },
  ]

  return (
    <header className="deneb-nav">
      <nav aria-label="Main navigation">
        <Logo />
        <div className="deneb-desktop-links">
          {SHOP_LINKS.map((link) => <LocalizedClientLink key={link.title} href={link.href}>{link.title}</LocalizedClientLink>)}
        </div>
        <LocalizedClientLink href="/search" className="deneb-search" aria-label="Search cards, sets, numbers">
          <Search size={20} aria-hidden="true" /><span>Search cards, sets, numbers</span>
        </LocalizedClientLink>
        <LocalizedClientLink href="/account" className="deneb-account">{customer ? 'Account' : 'Sign in'}</LocalizedClientLink>
        <Suspense fallback={<LocalizedClientLink href="/cart" className="deneb-account">Cart</LocalizedClientLink>}><CartButton /></Suspense>
        <SideMenu groups={groups} regions={regions} logo={<Logo />} />
      </nav>
    </header>
  )
}
