import type { ReactNode } from "react"
import Link from "next/link"
import {
  CardArt,
  CardFacts,
  PriceHistory,
  RarityMark,
  SealedTile,
  SetLogo,
  SlabView,
  finishLabel,
  sealedFormatLabel,
} from "@/features/storefront/components/cards"
import type { GradeFace } from "@/features/storefront/components/cards"
import type { CardSet } from "@/features/storefront/lib/data/cards"
import { BinderButton } from "./binder-button"
import { WantToggle } from "./want-toggle"

type Reading = { finish: string | null; condition: string | null; grade: string; lowMinor: number | null; midMinor: number | null; highMinor: number | null; marketMinor: number | null; observedAt: string }

export type DetailCard = {
  id: string
  name: string
  number: string | null
  rarity: string | null
  supertype: string | null
  energyTypes: string[]
  hp: string | null
  artist: string | null
  imageUrl: string | null
  imageLargeUrl: string | null
  kind: string
  sealedFormat: string | null
}

/**
 * A card's page: the card itself (or its slab, or its box end) on the left; on the right the
 * set line, the name, its printed facts, the purchase or want panel, and the market record.
 */
export function CardDetail({
  countryCode,
  currencyCode = 'USD',
  card,
  set,
  readings,
  grade,
  slabYear,
  purchase,
  title,
  primaryFinish,
  aside,
  preorder,
}: {
  countryCode: string
  currencyCode?: string
  card: DetailCard
  set: CardSet | null
  readings: Reading[]
  grade?: GradeFace | null
  slabYear?: number | null
  purchase?: ReactNode
  title?: string
  primaryFinish?: string | null
  aside?: ReactNode
  preorder?: { releaseDate: string | null; limit: number | null } | null
}) {
  const nearMint = readings.filter((r) => !r.grade && !r.condition)
  const finishes = [...new Set(nearMint.map((r) => r.finish ?? "normal"))]
  const sealed = card.kind === "sealed"
  const face = { id: card.id, name: card.name, number: card.number, rarity: card.rarity, setName: set?.name, imageUrl: card.imageUrl, imageLargeUrl: card.imageLargeUrl }

  return (
    <><nav className="deneb-breadcrumb" aria-label="Breadcrumb"><Link href={`/${countryCode}/store`}>Singles</Link><span>/</span>{set ? <><Link href={`/${countryCode}/sets/${set.handle}`}>{set.name}</Link><span>/</span></> : null}<span>{card.name} {card.number}</span></nav><div className="tc deneb-detail">
      <div className="deneb-detail-art">
        {grade ? (
          <SlabView card={face} grade={grade} year={slabYear} eager />
        ) : sealed ? (
          <SealedTile
            as="div"
            title={title ?? card.name}
            setName={set?.name}
            setCode={set?.code}
            logoUrl={set?.logoUrl}
            format={card.sealedFormat}
            href={set ? `/${countryCode}/sets/${set.handle}` : `/${countryCode}/sets`}
            bare
            preorder={Boolean(preorder)}
            releaseDate={preorder?.releaseDate ?? set?.releaseDate}
          />
        ) : (
          <CardArt src={card.imageLargeUrl || card.imageUrl} alt={`${card.name} card art`} eager />
        )}
        {purchase}
        <WantToggle catalogItemId={card.id} label={card.name} finish={primaryFinish ?? null} wide />
      </div>

      <div className="deneb-detail-info">
        <div className="grid gap-3">
          <h1 className="font-cx-display text-[38px] leading-[1.02] text-cx-ink sm:text-[52px]">{(title ?? card.name).replace(/\s*\(Pre-order\)$/, "")}</h1>
          {!sealed && set ? (
            <Link href={`/${countryCode}/sets/${set.handle}`} className="group flex w-fit items-center gap-3 text-[14px] text-cx-ink-2 hover:text-cx-ink">
              {set.logoUrl ? <span className="flex h-7 items-center"><SetLogo set={set} className="h-full max-w-[90px]" /></span> : null}
              <span className="tc-num group-hover:underline group-hover:underline-offset-4">{[set.name, card.number].filter(Boolean).join(" · ")}</span>
            </Link>
          ) : null}
          {card.rarity ? (
            <p className="flex items-center gap-2 text-[15px] text-cx-ink-2"><RarityMark rarity={card.rarity} /> {card.rarity}</p>
          ) : null}
        </div>

        <section className="deneb-detail-market" aria-label="Market price">
          <h2>MARKET PRICE</h2>
          {finishes.length ? finishes.map(f => <PriceHistory key={f} currencyCode={currencyCode} readings={nearMint.filter(r => (r.finish ?? 'normal') === f).map(r => ({ lowMinor:r.lowMinor, midMinor:r.midMinor, highMinor:r.highMinor, marketMinor:r.marketMinor, observedAt:r.observedAt }))} label={`TCGplayer market, ${finishLabel(f)}`} />) : <p>No market readings for this {sealed ? 'product' : 'card'} yet.</p>}
          {grade ? <p>Market readings are for raw copies, not this graded slab.</p> : null}
        </section>
        <div className="deneb-detail-record"><h2>DETAILS</h2><CardFacts
          facts={sealed ? [
            { label: "Product", value: sealedFormatLabel(card.sealedFormat) },
            { label: "Set", value: set?.name },
            { label: "Set code", value: set?.code },
            { label: "Language", value: "English" },
          ] : [
            { label: "Set", value: set ? `${set.name}${set.series ? ` (${set.series})` : ""}` : null },
            { label: "Number", value: card.number },
            { label: "Rarity", value: card.rarity },
            { label: "Card type", value: [card.supertype, card.energyTypes.join(", ")].filter(Boolean).join(" · ") },
            { label: "HP", value: card.hp },
            { label: "Illustrator", value: card.artist },
            { label: "Grade", value: grade ? `${grade.company} ${grade.grade}${grade.label ? ` ${grade.label}` : ""}` : null },
            { label: "Certificate", value: grade?.certificate ? grade.certificate : null },
          ]}
        /></div>

        {!sealed ? <BinderButton catalogItemId={card.id} finish={primaryFinish ?? null} label={card.name} /> : null}
        {aside}
      </div>
    </div></>
  )
}
