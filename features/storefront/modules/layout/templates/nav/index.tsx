import { Suspense } from 'react'
import LocalizedClientLink from '@/features/storefront/modules/common/components/localized-client-link'
import CartButton from '@/features/storefront/modules/layout/components/cart-button'
import Logo from '@/features/storefront/modules/layout/components/logo'
import { Search, Home, Layers, Tag, ShoppingCart } from 'lucide-react'

export default async function Nav() {
  return <>
    <header className="deneb-nav"><nav aria-label="Main navigation">
      <Logo />
      <div className="deneb-desktop-links">{[['Singles','/store?kind=raw'],['Sets','/sets'],['Sealed','/store?kind=sealed'],['Graded','/store?kind=graded'],['Buylist','/trade-in']].map(([label,href]) => <LocalizedClientLink key={label} href={href}>{label}</LocalizedClientLink>)}</div>
      <LocalizedClientLink href="/search" className="deneb-search" aria-label="Search cards, sets, numbers"><Search size={18}/><span>Search cards, sets, numbers</span></LocalizedClientLink>
      <LocalizedClientLink href="/account" className="deneb-account">Account</LocalizedClientLink>
      <Suspense fallback={<LocalizedClientLink href="/cart">Cart</LocalizedClientLink>}><CartButton /></Suspense>
    </nav></header>
    <nav className="deneb-bottom-nav" aria-label="Mobile navigation">{[[Home,'Shop','/'],[Layers,'Sets','/sets'],[Tag,'Sell','/trade-in'],[ShoppingCart,'Cart','/cart']].map(([Icon,label,href]) => {const Glyph = Icon as typeof Home; return <LocalizedClientLink key={String(label)} href={String(href)}><Glyph size={25}/><span>{String(label)}</span></LocalizedClientLink>})}</nav>
  </>
}
