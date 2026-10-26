import Link from "next/link"
import { CardBadge, CardTile, SealedTile, SlabView, fromPrice, money } from "@/features/storefront/components/cards"
import type { CardProduct } from "@/features/storefront/lib/data/cards"

const GRADE_RE = /\b(PSA|BGS|CGC)\s+(10|[1-9](?:\.5)?)\b\s*(.*)$/

/** Grade facts for a slab, read from the product's own record (subtitle "Set · PSA 10 GEM MT"). */
export function slabGrade(product: CardProduct) {
  const source = product.subtitle || product.title
  const match = GRADE_RE.exec(source)
  if (!match) return null
  return { company: match[1], grade: match[2], label: match[3]?.trim() || null }
}

function availablePrices(product: CardProduct) {
  return product.productVariants
    .filter((v) => v.inventoryQuantity > 0 || v.preorder)
    .flatMap((v) => v.prices.map((p) => p.amount))
}

/** Any card-shop product as its tile: a single, a slab in its case, or sealed product by its box end. */
export function ProductCardTile({ product, countryCode, eager }: { product: CardProduct; countryCode: string; eager?: boolean }) {
  const href = `/${countryCode}/products/${product.handle}`
  const item = product.catalogItem
  const set = item?.collectibleSet
  const currency = product.productVariants.find((v) => v.prices[0])?.prices[0]?.currency?.code?.toUpperCase() || "USD"
  const prices = availablePrices(product)
  const soldOut = prices.length === 0
  const kind = product.productVariants[0]?.stockKind

  if (kind === "sealed" || item?.kind === "sealed") {
    const variant = product.productVariants[0]
    return (
      <SealedTile
        title={product.title.replace(/\s*\(Pre-order\)$/, "")}
        setName={set?.name}
        setCode={set?.code}
        logoUrl={set?.logoUrl || null}
        format={item?.sealedFormat}
        price={fromPrice(prices, currency)}
        href={href}
        preorder={Boolean(variant?.preorder)}
        releaseDate={variant?.preorderReleaseDate || set?.releaseDate}
        limit={variant?.preorderLimitPerCustomer}
        soldOut={soldOut}
      />
    )
  }

  const face = {
    id: product.id,
    name: item?.title || product.title,
    number: item?.cardNumber || null,
    rarity: item?.rarity || null,
    setName: set?.name || null,
    imageUrl: item?.imageUrl || product.thumbnail,
    imageLargeUrl: item?.imageLargeUrl || null,
  }

  if (kind === "graded") {
    const grade = slabGrade(product)
    return (
      <li className="tc-tile">
        <Link href={href} className="grid gap-2.5 outline-none" aria-label={product.title}>
          {grade ? (
            <SlabView card={face} grade={grade} compact eager={eager} />
          ) : null}
          <span className="flex items-baseline justify-between gap-2">
            <span className="tc-num text-[16px] font-bold text-[var(--tc-ink)]">{soldOut ? "Sold" : money(Math.min(...prices), currency)}</span>
            <span className="text-[12px] text-[var(--tc-ink-3)]">{set?.name}</span>
          </span>
        </Link>
      </li>
    )
  }

  const conditions = [...new Set(product.productVariants.filter((v) => v.inventoryQuantity > 0).map((v) => v.cardCondition).filter(Boolean))]
  const finish = product.productVariants.find((v) => v.cardFinish && v.cardFinish !== "normal" && v.cardFinish !== "holofoil")?.cardFinish
  return (
    <CardTile
      card={face}
      href={href}
      eager={eager}
      price={fromPrice(prices, currency)}
      soldOut={soldOut}
      priceNote={conditions.length ? conditions.join(" · ") : undefined}
      badges={finish ? <CardBadge>{finish === "reverse_holofoil" ? "Reverse" : finish.startsWith("first_edition") ? "1st Ed" : "Unlimited"}</CardBadge> : null}
    />
  )
}
