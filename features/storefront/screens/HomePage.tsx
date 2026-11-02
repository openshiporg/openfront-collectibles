import { Metadata } from "next"
import Link from "next/link"
import { getRegion } from "@/features/storefront/lib/data/regions"
import { getStore } from "@/features/storefront/lib/data/store"
import { getCardProducts, getCardSets } from "@/features/storefront/lib/data/cards"
import { money } from "@/features/storefront/components/cards"

export async function generateMetadata(): Promise<Metadata> {
  const store = await getStore()
  return { title: store?.name || "Card shop", description: store?.homepageDescription || "" }
}

export async function HomePage({ params }: { params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await params
  const region = await getRegion(countryCode)
  if (!region) return null
  const currency = region.currency?.code?.toUpperCase() || "USD"
  const [sets, inventory] = await Promise.all([
    getCardSets(currency), getCardProducts({ countryCode, limit: 400, sort: "price_desc" }),
  ])
  const singles = inventory.products.filter(p => p.productVariants.some(v => v.stockKind === "raw" && v.inventoryQuantity > 0))
  const stocked = inventory.products.reduce((n, p) => n + p.productVariants.reduce((q, v) => q + Math.max(0, v.inventoryQuantity), 0), 0)
  const stockedSets = sets.filter(s => (s.cardsStocked ?? 0) > 0).slice(0, 4)
  const href = (path: string) => `/${countryCode}${path}`
  const tabs = [["Singles", "/store?kind=raw"], ["Sets", "/sets"], ["Sealed", "/store?kind=sealed"], ["Graded", "/store?kind=graded"], ["Buylist", "/trade-in"]]
  return <div className="deneb-home">
    <section className="deneb-overview">
      <div className="deneb-intro"><h1>CARDS. PRICED LIVE.</h1><p>Raw and graded singles. Find your next card.</p><div><Link className="deneb-primary" href={href('/store?kind=raw')}>Shop singles</Link><Link className="deneb-outline" href={href('/trade-in')}>Sell to us</Link></div></div>
      <div className="deneb-stock"><span>STORE INVENTORY</span><strong>{stocked.toLocaleString()}</strong><p>Cards & sealed items in stock</p><Link href={href('/sets')}>{stockedSets.length ? sets.filter(s => (s.cardsStocked ?? 0) > 0).length : 0} stocked sets →</Link></div>
      <dl className="deneb-stats"><div><dt>Singles in stock</dt><dd>{singles.length}</dd></div><div><dt>Products</dt><dd>{inventory.count}</dd></div><div><dt>Catalog sets</dt><dd>{sets.length}</dd></div></dl>
    </section>
    <nav className="deneb-mobile-tabs" aria-label="Browse inventory">{tabs.map(([label,path]) => <Link key={label} href={href(path)}>{label}</Link>)}</nav>
    <section className="deneb-shelf" aria-labelledby="stock-title"><div className="deneb-section-head"><h2 id="stock-title">SINGLES IN STOCK</h2><Link href={href('/store?kind=raw&sort=price_desc')}>Most valuable ↗</Link></div>
      <div className="deneb-card-grid">{singles.slice(0,6).map(p => {
        const card = p.catalogItem
        const variant = p.productVariants.filter(v => v.stockKind === 'raw' && v.inventoryQuantity > 0).sort((a,b) => (a.prices.find(x => x.currency?.code?.toUpperCase() === currency)?.amount ?? Infinity) - (b.prices.find(x => x.currency?.code?.toUpperCase() === currency)?.amount ?? Infinity))[0]
        const price = variant?.prices.find(x => x.currency?.code?.toUpperCase() === currency)
        return <Link className="deneb-card" key={p.id} href={href(`/products/${p.handle}`)}><img src={card?.imageLargeUrl || card?.imageUrl || p.thumbnail || undefined} alt={card?.title || p.title} loading="eager" /><div><h3>{card?.title || p.title}</h3><strong>{price ? money(price.amount,currency) : 'Price unavailable'}</strong><p>{[card?.collectibleSet?.code,card?.cardNumber,variant?.cardCondition].filter(Boolean).join(' · ')}</p></div></Link>
      })}</div>
    </section>
    {stockedSets.length > 0 && <section className="deneb-sets"><h2>BROWSE SETS</h2><div>{stockedSets.map(set => {
      const preview = inventory.products.filter(p => p.catalogItem?.collectibleSet?.handle === set.handle && p.catalogItem?.kind === 'single').filter((p,i,a) => a.findIndex(x => x.catalogItem?.id === p.catalogItem?.id) === i).slice(0,5)
      const total = set.totalCards || set.printedTotal || 0
      return <Link key={set.handle} href={href(`/sets/${set.handle}`)}><h3>{set.name} · {set.code} <span>›</span></h3><p>{set.cardsStocked} {total ? `of ${total}` : 'cards'} in stock</p>{total > 0 && <progress value={set.cardsStocked ?? 0} max={total} aria-label={`${set.name} stock coverage`} />}<div className="deneb-set-art">{preview.map(p => <img key={p.id} src={p.catalogItem?.imageUrl || p.thumbnail || undefined} alt={p.catalogItem?.title || p.title} />)}</div></Link>
    })}</div></section>}
  </div>
}
