# Openfront Collectibles: storefront and platform direction (2026-10-23)

## Who comes first
- **Collector:** hunting one specific object: a card, a comic, a coin, a figure, a watch. Every listing is a single specimen, so the questions are *which exact one, what condition, who graded it, can I check the certificate, where has it been, what is it worth*, then price and shipping.
- **Merchant:** a collectibles dealer or consignment house. First thing each day: what came in (intake, consignment, trade-ins), what is waiting on grading or condition review, what is listed or live at auction, and which paid high-value orders need signature shipping.

## Direction: "catalogue & slab"
An auction-house catalogue on archival paper. Item names are set in a serif like catalogue entries; references (certificate numbers, SKUs, grades, counts, prices) are set in mono; one bronze accent taken from the store's logo. The signature object is the **slab label**, modelled on a grading-slab label: a dark vault band with the grader and the grade, over a paper strip with the item, the certificate reference and its verification state.

### Type (Google Fonts, OFL)
- **Newsreader** (optical sizes) for display and item titles: hero 44/46 to 72/72 at -0.015em, section titles 26/30 to 30/34, item titles 16/20 to 32/36.
- **Hanken Grotesk** for UI and body: body 15/24, labels 13/18 medium, small caps labels 11/16 at 0.08em (`.cx-label`).
- **JetBrains Mono** for references, grades, counts and prices: 11/16 to 16/20, tabular figures (`.cx-num`).

### Palette (storefront, light)
| Token | Value | Use |
| --- | --- | --- |
| `cx-bg` | `#F3F0E8` | Page ground (archival paper) |
| `cx-surface` | `#FFFDF8` | Raised: pills, panels, inputs, slab strip |
| `cx-well` | `#E8E3D7` | Recessed: tracks, image wells, list bands |
| `cx-ink` | `#1A1712` | Text, primary buttons |
| `cx-ink-2` | `#5A5348` | Secondary text |
| `cx-ink-3` | `#8C8477` | Tertiary text, disabled |
| `cx-line` | `#D8D1C2` | Hairlines |
| `cx-vault` | `#201C16` | Slab band, footer |
| `cx-accent` | `hsl(var(--cx-h) 64% 34%)` | Store accent, from the saved logo colour |
| `cx-accent-soft` | `hsl(var(--cx-h) 58% 62%)` | Accent on the vault band |
| `cx-tint` | `hsl(var(--cx-h) 52% 91%)` | Accent wash: selected, empty art |
| `cx-ok` / `cx-warn` / `cx-danger` | `#2F6B3F` / `#9A5B12` / `#A6302A` | Status dots and errors |

`--cx-h` = (221 + saved logo hue rotation) mod 360. The default mark is the Untitled UI **Kintsugi** registry mark (an eight-point seal) rotated 165° to bronze. A store still carrying the Store model's non-registry column default is treated as having no logo chosen, so it gets Kintsugi (`features/storefront/lib/collectibles-brand.ts`).

### Core components (`features/storefront/modules/common/components/collectibles/`)
- **Track + pill** (`track.tsx`, `.cx-track` / `.cx-pill`): a recessed `cx-well` track with the active item as a raised `cx-surface` pill. Every in-page tab, sort, filter, option choice and account section switch.
- **Buttons** (`.cx-btn`): ink pill for primary, 48px tall. Secondary is a pill in a track or a text link with an up-right arrow.
- **Status dot** (`status-dot.tsx`): 8px, on the title line (parent `items-baseline`), never centred in a row.
- **Slab label** (`slab-label.tsx`): grader + grade on the vault band, title/line/cert/verification on the strip. Only fields the record holds; "Ungraded" when there is no grade observation.
- **Section head** (`section-head.tsx`): serif title, mono count, optional "View all" link.
- **List band** (`.cx-band`): one recessed band with hairline rows instead of stacked cards.
- **Image well:** product imagery sits on `cx-well` at 4:5 with 14px radius; when there is no photo, the well shows the category in `.cx-label` and the title in serif. Never invented copy.
- Icons: lucide only. Up-right arrow for links out. No emoji or unicode arrows.

### Copy
Labels, states and errors only. No tips, no taglines we made up, no filler. The merchant's own homepage title and description are the only marketing copy.

### Layouts
- **Header:** logo lockup (mark + serif store name), desktop category links, Account, Cart with mono count. Phone: menu sheet (Shop / Collections / You / Ship to), logo, cart.
- **Footer:** vault band, logo, ship-to select, categories, collections, account links.
- **Home:** merchant title and description set large in serif; a typographic category index (serif names, mono numbering) as the main way in; collection rails; recently listed specimens as slab-label tiles when public listings exist.
- **Browse (all / category / collection):** serif title with mono count; category track; sort track; 2-up on phone, 3-up tablet, 4-up desktop.
- **Product:** image well/gallery; serif title with availability dot; mono price; slab label; "Condition / Grading / Provenance / Valuation" record as a catalogue entry with dates in mono and attributed disclaimers; add to cart; sticky add bar on phone.
- **Cart and checkout:** single column on phone, summary on the right on desktop; prices in mono.
- **Account:** section track; orders as a list band with status dots on the title line.

## Platform (dashboard pages under `/dashboard/platform`)
Inside the unchanged shared shell. The dashboard's fonts and tokens stay so pages work in light and dark; the kit (`features/platform/components/vault-ui.tsx`) supplies `PageTitle` (dot on the title line), `StatusFilter` / `Track` / `Pill` (raised pill in recessed track), `ListBand` / `BandRow`, `SectionTitle`, `PillLink`, `humanize`.
- **Desks first:** each collectibles area (Catalog, Inventory & custody, Listings & offers, Auctions, Consignment, Buylist & trade-in, Condition & grading, High-value fulfillment, Collectors & sellers) is a live desk: status counts as a track, the newest records in each queue as band rows with title-line dots, and links into the full list and record pages.
- **Commerce core:** orders, products, inventory, analytics and the shared catalogue/settings lists use the same kit.
