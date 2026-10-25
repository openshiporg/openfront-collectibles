# Product

<!-- impeccable:product-schema 1 -->

Inferred on 2026-10-25 from the repository (README, `docs/design/collectibles-redesign-2026-10-23.md`, QA audits) and the owner's redesign brief (`~/Code/Euler/state/briefs/design-skills-redesign-2026-10-25.md`). The owner ordered the work without an approval stage, so no interview took place. Every line below is inferred, not confirmed.

## Platform

web

## Users
- **Collector (storefront):** hunting one specific object (a card, a comic, a coin, a figure, a watch, art, memorabilia). Every listing is a single specimen, so the questions are: which exact one, what condition, who graded it, the certificate, where it has been, what it's worth, then price and shipping.
- **Merchant (platform):** a collectibles dealer or consignment house working intake, grading, listings, auctions, consignment, trade-ins and high-value fulfilment. The platform shell is shared with Openfront E-commerce and isn't in scope for storefront work.

## Product Purpose
A self-hostable catalog and discovery app for unique physical specimens. Collectors browse published items by category and collection, read each item's condition, grading, provenance and valuation record, buy through the cart and checkout (bank transfer), trade items in, and manage an account (orders, wishlist, saved searches, trade-ins, addresses, invoices).

## Positioning
Each listing is one specimen with its own record (condition, grade observation, certificate, provenance, valuation), not a SKU with stock.

## Operating Context
Routes sit under `/[countryCode]`: home, `/store`, `/categories/[...category]`, `/collections/[handle]`, `/products/[handle]`, `/search`, `/cart`, `/checkout`, `/order/confirmed/[id]`, `/account` (dashboard, orders, order details, profile, addresses, wishlist, saved searches, trade-ins, invoices, invoicing, login, checkout-link) and `/trade-in`.

## Capabilities and Constraints
- E-commerce storefront architecture (`features/storefront/modules`, `screens`), with country-prefixed routes.
- Bidding, offers, payouts and settlement are not launch-ready. The storefront must not imply them.
- Demo item artwork (`public/images/collectibles/*.svg`) is illustrative and carries its own light ground.

## Brand Commitments
- The store's own name, logo SVG and logo hue are the brand. The default mark is Untitled UI Kintsugi.
- Owner direction for this redesign (2026-10-24): dark, considered and premium; no grey, washed-out grounds; no generic SaaS cards; UI copy is labels, states and errors only; phone width must work; never drop products, categories or collections. Tessier (`~/Code/shops/tessier`) is the reference the owner likes.

## Evidence on Hand
Live catalog data: 7 categories, collections (Fresh to the vault, Staff picks, Under $500) and items with records. There are no testimonials, press or sales figures, and none may be invented.

## Product Principles
1. The specimen and its record come first; the price follows the facts.
2. Show only what the record holds. Never invent grades, provenance or claims.
3. Every route, state and workflow stays. Presentation changes; behaviour doesn't.
