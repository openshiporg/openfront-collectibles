# Product

<!-- impeccable:product-schema 1 -->

Updated 2026-10-25 for the Pokémon overhaul ordered by the owner ("make Openfront Collectibles very focused on Pokémon cards; even the demo and the onboarding should be Pokémon cards"). Market research and the full model are in `docs/PRODUCT-SPEC.md`. The owner ordered the work without an approval stage, so no interview took place; lines marked inferred were not confirmed.

## Platform

web

## Users
- **Collector (storefront):** looks a card up by set and number, compares condition and price against the market, buys singles, slabs and sealed product, pre-orders new sets, sells cards to the shop for cash or credit, and keeps a binder of what they own and a want list of what they don't.
- **Merchant (platform):** a Pokémon TCG shop stocking singles by condition, graded slabs and sealed product; refreshing market prices and repricing by rule; running a buylist and trade-ins; taking consignment. The platform shell is shared with Openfront E-commerce.

## Product Purpose
A self-hostable Pokémon card shop. Every set is a full checklist with the shop's stock ticked and a market reading on every card; cards are bought by condition, slabs by grade and certificate, sealed product by box, pre-orders by street date.

## Positioning
The checklist is the shop: what you have, what it costs, what we buy. Inferred: set completion and the collector's own binder are what separates it from a generic store.

## Operating Context
Routes under `/[countryCode]`: home, `/sets`, `/sets/[handle]`, `/cards/[id]`, `/store`, `/categories/[...category]`, `/collections/[handle]`, `/products/[handle]`, `/search`, `/trade-in` (Sell to us), `/cart`, `/checkout`, `/order/confirmed/[id]`, `/account` (overview, orders, binder, want list, saved searches, sold to us, profile, addresses, business account, invoices). Platform pages under `/dashboard/platform`, including Cards & Sets, Graded Slabs, Sealed & Pre-orders, Market & Repricing and Buylist.

## Capabilities and Constraints
- Card data and image URLs come from the Pokémon TCG API's data (bundled checklists); market prices are TCGplayer readings via TCGCSV, dated. Prices are not per condition at the source; conditions price as a share of Near Mint.
- Demo slab certificates are samples and never link to a grader lookup.
- Card UI is our own slice (`features/storefront/components/cards`), shared with platform pages; no third-party card UI library (owner, 2026-10-25).
- Bidding and auctions are not launch-ready and are not shown on the storefront.

## Brand Commitments
- The store's own name, logo SVG and logo hue are the brand. The default mark is Untitled UI Boltshift in card-border yellow.
- Owner direction (2026-10-24, kept): dark, considered and premium; no grey, washed-out grounds; no generic SaaS cards; UI copy is labels, states and errors only; phone width must work.
- Pokémon is a trademark of its owners; the storefront states the shop is independent and not affiliated.

## Evidence on Hand
Real: 19 sets' card lists, TCGplayer market readings (2026-10-25), sealed product prices, the Delta Reign street date. Fictional: the shop's name, stock quantities, slab asking prices, sample certificates and consignor. No testimonials, press or sales figures exist, and none may be invented.

## Product Principles
1. The number is the navigation: every card is findable by set and number.
2. Show the market reading with its source and date; never invent a price, grade or certificate.
3. Every route, state and workflow stays working; presentation changes serve the card shop.
