---
name: Openfront Collectibles Storefront
description: A collector's black-page stock book; specimens in glassine pockets, the store's name on its cloth cover.
colors:
  page-black: "oklch(14.5% 0.006 60)"
  page-band: "oklch(19.5% 0.008 60)"
  page-band-raised: "oklch(23% 0.008 60)"
  specimen-well: "oklch(11.5% 0.005 60)"
  paper-ink: "oklch(94.5% 0.012 85)"
  paper-ink-2: "oklch(80% 0.012 80)"
  paper-ink-3: "oklch(66% 0.012 80)"
  page-rule: "oklch(30% 0.01 60)"
  field-stroke: "oklch(34% 0.01 60)"
  buckram: "hsl(26 34% 15%)"
  buckram-raised: "hsl(26 30% 24%)"
  gilt: "hsl(26 58% 66%)"
  gilt-hover: "hsl(26 62% 74%)"
  gilt-soft: "hsl(26 62% 76%)"
  gilt-tint: "hsl(26 26% 17%)"
  status-danger: "oklch(71% 0.17 25)"
  status-ok: "oklch(78% 0.14 150)"
  status-warn: "oklch(82% 0.13 75)"
typography:
  display:
    fontFamily: "Rokkitt, ui-serif, Georgia, serif"
    fontSize: "clamp(48px, 7.2vw, 104px)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Rokkitt, ui-serif, Georgia, serif"
    fontSize: "44px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Rokkitt, ui-serif, Georgia, serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1
  body-lead:
    fontFamily: "Literata, ui-serif, Georgia, serif"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: "30px"
  body:
    fontFamily: "Literata, ui-serif, Georgia, serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  body-small:
    fontFamily: "Literata, ui-serif, Georgia, serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Rokkitt, ui-serif, Georgia, serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: "18px"
    letterSpacing: "0.01em"
  numeral:
    fontFamily: "Rokkitt, ui-serif, Georgia, serif"
    fontWeight: 600
    letterSpacing: "0.01em"
    fontFeature: "\"tnum\" 1, \"lnum\" 1"
rounded:
  square: "2px"
  dot: "999px"
spacing:
  "1": "4px"
  "1.5": "6px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "10": "40px"
  container: "1320px"
components:
  button-primary:
    backgroundColor: "{colors.gilt}"
    textColor: "{colors.page-black}"
    typography: "{typography.title}"
    rounded: "{rounded.square}"
    padding: "0 24px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.gilt-hover}"
    textColor: "{colors.page-black}"
  pill:
    backgroundColor: "{colors.page-band}"
    textColor: "{colors.paper-ink-2}"
    rounded: "{rounded.square}"
    padding: "0 14px"
    height: "40px"
  pill-hover:
    backgroundColor: "{colors.page-band-raised}"
    textColor: "{colors.paper-ink}"
  pill-active:
    backgroundColor: "{colors.gilt}"
    textColor: "{colors.page-black}"
  input:
    backgroundColor: "{colors.page-band}"
    textColor: "{colors.paper-ink}"
    rounded: "{rounded.square}"
    padding: "0 16px"
    height: "48px"
  header-band:
    backgroundColor: "{colors.buckram}"
    textColor: "{colors.paper-ink}"
    height: "64px"
  nav-link-hover:
    backgroundColor: "{colors.buckram-raised}"
    textColor: "{colors.paper-ink}"
    rounded: "{rounded.square}"
  thumb-index-tab:
    backgroundColor: "{colors.buckram-raised}"
    textColor: "{colors.paper-ink}"
    rounded: "{rounded.square}"
    padding: "0 32px 0 20px"
    height: "54px"
  thumb-index-tab-hover:
    backgroundColor: "{colors.gilt}"
    textColor: "{colors.page-black}"
  specimen-well:
    backgroundColor: "{colors.specimen-well}"
    rounded: "{rounded.square}"
  page-band:
    backgroundColor: "{colors.page-band}"
    textColor: "{colors.paper-ink}"
    rounded: "{rounded.square}"
  slab-band:
    backgroundColor: "{colors.buckram}"
    textColor: "{colors.paper-ink}"
    padding: "16px 20px"
---

# Design System: Openfront Collectibles Storefront

Scope: the customer storefront under `/[countryCode]`, wrapped by the collectibles shell (`.cx-sf`). The merchant platform is a shared shell and is not governed by this file.

## Overview

**Creative North Star: "The Dealer's Stock Book"**

The storefront is a collector's black-page stock book. Pages are near-black (never grey), ink is warm paper-white, and each specimen sits in a dark well behind a clear glassine strip. The store's own cloth cover (buckram, dyed in the store's logo hue) binds the header band, the home cover, the grading-slab band and the footer, and gilt pressed from that same hue is the only accent. Everything stamped (titles, labels, numbers, prices, tabs) is set in Rokkitt slab; everything read is set in Literata.

Density is a dealer's ledger, not a gallery: small, legible type (13 to 15px for records), tight 4 to 8px gaps between bands, and a single 1320px column with square 2px corners everywhere. Depth comes from tone, not shadow: the page, the band, the well and the cloth are four stepped values of the same warm dark. Motion is brief and physical: rows print in once on home, specimens lift a few pixels inside their pocket, pressed controls give 3%.

The hue is the store's, not the system's. Every cloth and gilt value is `hsl(var(--cx-h) ...)` with `--cx-h` set per store from its saved logo colour (default 26, a copper). The values in the frontmatter are that default resolved; never hard-code a hue.

**Key Characteristics:**
- Black album page (page-black) with warm paper-white ink; no grey grounds.
- Buckram cloth in the store hue for header, cover, slab band and footer.
- Gilt (same hue) as the one accent: primary action, chosen pill, hover.
- Rokkitt slab for stamped text and numbers; Literata for reading.
- Square 2px corners; flat tonal layers; one popover shadow.
- Glassine pocket over every specimen image; the specimen lifts and the pocket clears on hover.

**Open item.** The contract names buckram as a cloth texture. It is not rendered: the cloth is a flat tonal fill because no raster texture asset exists yet. Until one ships with provenance, buckram is a colour, not a material, and no surface may fake the weave with CSS noise or gradients.

## Colors

A warm near-black page with paper-white ink, and one store-dyed hue that appears twice: deep as cloth, bright as gilt.

### Primary
- **Gilt** (gilt): the one accent. Primary button fill, chosen pill, thumb-index tab on hover, link hover, focus ring, text selection. Hovered buttons brighten to **Gilt Bright** (gilt-hover).
- **Gilt Soft** (gilt-soft): the grader's name stamped on the slab band; never a fill.

### Secondary
- **Buckram** (buckram): the cover cloth. Header band, home cover panel, grading-slab band, footer.
- **Buckram Raised** (buckram-raised): thumb-index tabs at rest, nav hover fill, the trade-in link's underline, and the footer's oversized store-name stamp.
- **Gilt Tint** (gilt-tint): the plate behind a no-photo specimen and applied discount chips.

### Neutral
- **Page Black** (page-black): the album page; also the text colour on any gilt fill.
- **Page Band** (page-band): rows, record tables, pills at rest, inputs, popovers.
- **Page Band Raised** (page-band-raised): pill hover; shadcn secondary/muted/accent surfaces inside the storefront.
- **Specimen Well** (specimen-well): the recess an item image sits in; darker than the page.
- **Paper Ink** (paper-ink): titles and primary text. **Paper Ink 2** (paper-ink-2): secondary text, inactive nav and pills. **Paper Ink 3** (paper-ink-3): labels, counts, placeholders, muted states.
- **Page Rule** (page-rule): hairline dividers and input strokes; **Field Stroke** (field-stroke) is the shadcn input token.

### Status
- **OK / Warn / Danger** (status-ok, status-warn, status-danger): only as 8px status dots and error text, never as fills.

### Named Rules
**The One Hue Rule.** Cloth and gilt are both derived from the store's `--cx-h`. No second accent hue exists; status colours are dots, not decoration.

**The No Grey Ground Rule.** Every surface is a warm dark from the page family (chroma 0.005 to 0.008, hue 60). Neutral grey or washed-out mid-tone grounds are out.

## Typography

**Display Font:** Rokkitt (slab, with ui-serif, Georgia)
**Body Font:** Literata (with ui-serif, Georgia)

**Character:** A stamped slab against a bookish text face. Rokkitt reads as embossed cover lettering and ledger numerals; Literata carries the record prose and item names at small sizes without strain.

### Hierarchy
- **Display** (Rokkitt 800, 48px phone / 80px tablet / 104px desktop, line-height 0.92, -0.02em, max 14ch, balanced): the store title stamped on the home cover; the footer repeats the name at up to 164px in Buckram Raised.
- **Headline** (Rokkitt 800, 32/34px phone, 44/44px desktop, -0.01em): section heads ("Recently listed", "Item record"), product title, with an optional stamped count beside it.
- **Title** (Rokkitt 700, 21 to 24px): thumb-index tabs, sub-heads; nav links and pills use Rokkitt 600 to 700 at 15 to 17px.
- **Body Lead** (Literata 400, 17/27px phone, 19/30px desktop, max 46ch): cover description.
- **Body** (Literata 400, 15 to 17px): item names on cards (16/21 to 17/23px), record prose, footer links.
- **Body Small** (Literata 400, 13 to 14px): the record's working size: lines, meta, status labels, table cells.
- **Label** (Rokkitt 600, 14/18px, 0.01em, Paper Ink 3, sentence case): field and column labels.
- **Numeral** (Rokkitt 600, tabular lining figures, 0.01em): prices, grades, certificate numbers, counts, SKUs.

### Named Rules
**The Stamp and Read Rule.** If it is stamped (a title, a label, a number, a price, a control), it is Rokkitt. If it is read (a name, a sentence, a record line), it is Literata. Note: the CSS aliases `font-cx-mono` and `font-cx-serif` are legacy names; there is no monospace in this system and "serif" resolves to Literata.

**The Sentence Case Rule.** Labels are sentence case at 0.01em tracking. Uppercase appears only where the source object prints it: the grader's name on a slab band, a carrier code, a discount code.

## Layout

One centred column, max 1320px, with 16px side gutters on phone and 24px from 640px. The header band is 64px and sticky. Home opens on the full-width cloth cover (min 520px tall on desktop, two columns at roughly 1.15 : 0.85) with the stamped title bottom-left and the category thumb index down the right edge; below 1024px the index stacks under the title. Each category tab steps 14px further right than the one above, like a stock book's cut index.

Specimen grids run four across on desktop and two on phone, with 12 to 16px gaps; images keep a 4:3 well (square for small and cart sizes). Record rows and tables sit in page bands stacked 4 to 8px apart. Spacing rhythm is the 4px step (4, 6, 8, 12, 16, 24, 40); larger section breaks are generous gutters of plain page. Tap targets are at least 44px on phone (pills grow from 40 to 44px below 640px).

## Elevation & Depth

Flat and tonal. Depth is four stepped darks: the specimen well (11.5%) is recessed below the page (14.5%), page bands (19.5%) sit on it, and raised hover surfaces (23%) above those; cloth is a parallel hued layer. The glassine pocket is the one material effect: a translucent white strip (5.5% white) over the lower 42% of every specimen well, with a 16%-white folded top edge.

### Shadow Vocabulary
- **Popover drop** (`box-shadow: 0 24px 48px -16px rgb(0 0 0 / 0.7)`): the nav's "More" menu and portalled popovers only, so a floating sheet separates from black.

### Named Rules
**The Flat Page Rule.** Bands, cards, wells and buttons carry no shadow. Only something that genuinely floats above the page (a menu, a popover) gets the popover drop.

**The Glassine Rule.** Every specimen image sits in a well with the glassine strip. On hover the image lifts 4px (300ms) and the strip clears from 5.5% to 3% white (200ms). Never replace this with a scale-up, glow or card shadow.

## Shapes

Square at 2px. Every band, well, button, pill, input, tab, popover and slab is `2px`. Thumb-index tabs lose their right corners where they run off the cover's edge. The only rounds are functional: 8px status dots, cart count badges and radio marks. Borders are rare; separation is tonal, with hairline Page Rule dividers inside records and as input strokes.

## Components

### Buttons
Gilt and stamped.
- **Shape:** square (2px).
- **Primary:** Gilt fill, Page Black text, Rokkitt 700 17px at 0.01em, 48px tall, 24px side padding.
- **Hover / Focus:** brightens to Gilt Bright over 160ms (pointer devices only); press scales to 0.97; focus is a 2px Gilt outline at 3px offset. Disabled drops to 40% opacity.
- **Secondary:** a plain text link in Rokkitt 600 17px, Paper Ink 2, with a 2px Buckram Raised underline at 6px offset that turns Gilt on hover ("Trade in" on the cover).

### Chips (pills on a track)
- **Style:** Page Band fill, Paper Ink 2, Rokkitt 600 15px, 40px tall (44px on phone), 14px padding, 4px apart on a horizontally scrolling track with no visible scrollbar.
- **State:** hover lifts to Page Band Raised with Paper Ink; the chosen pill is Gilt-filled with Page Black text; unavailable options are struck through in a dim ink and not-allowed.

### Cards / Containers
- **Specimen card:** no container. A 4:3 Specimen Well with the glassine strip and the image inset 9%, then the item name (Literata, turns Gilt on hover) and a stamped price beneath. With no photo, a Gilt Tint plate inside the well shows the category label and the name in Rokkitt.
- **Page band:** Page Band fill, 2px corners, no border or shadow; holds record rows, tables and summaries.
- **Internal padding:** 12 to 20px.

### Inputs / Fields
- **Style:** Page Band fill, 1px Page Rule stroke, 2px corners, 48px tall (44px compact), 16px padding, Literata 15px, Paper Ink 3 placeholder; hover strokes in Paper Ink 3.
- **Focus:** stroke turns Gilt with a 2px Gilt ring at 25% opacity.
- **Error:** Danger stroke and message text.

### Navigation
- **Header band:** sticky 64px Buckram band. Store mark left; category links centred in Rokkitt 16px (the current one Paper Ink 700, others Paper Ink 2 600); search, Trade in, Account and Cart right. Hover fills Buckram Raised. Overflow categories sit under "More" in a Page Band popover. Phone collapses to a side menu.
- **Footer:** Buckram band with label-headed link columns (Categories, Collections, Account), the country selector, and the store's name stamped oversized in Buckram Raised.

### Thumb Index (signature)
The home cover's category tabs: one filled Buckram Raised bar per top-level category, 54px tall, Rokkitt 700 21 to 24px with a trailing arrow, each stepped 14px right of the last and bleeding off the cover's right edge. Hover fills Gilt, turns the text Page Black and slides the tab 8px left (200ms, desktop). This is the primary way into the catalogue; every category is listed.

### Grading Slab Label (signature)
The record's grading slab. For a graded item, a Buckram band carries the grader's name (Rokkitt, uppercase, 0.12em, Gilt Soft) and the grade (Literata, 44px large / 26px small); beneath it a Page Band strip holds the item name, line, certificate number and a verification dot. An ungraded item shows the strip alone; nothing absent from the record is drawn.

### Motion
One easing for everything: `cubic-bezier(0.23, 1, 0.32, 1)`. State colour changes run 160ms, presses 140ms, pocket and tab moves 200 to 300ms. On home, cover rows print in once (620ms rise of 14px, staggered 60ms); all of it is gated on `prefers-reduced-motion: no-preference`.

## Do's and Don'ts

### Do:
- **Do** derive every cloth and gilt value from `--cx-h`; the store's logo hue is the brand.
- **Do** set stamped text and every number in Rokkitt with tabular lining figures, and read text in Literata.
- **Do** put every specimen image in a Specimen Well with the glassine strip, inset 9%.
- **Do** keep all corners at 2px and separate surfaces by tone (well, page, band, raised).
- **Do** keep Gilt to the primary action, the chosen state, hover and focus.
- **Do** show only what an item's record holds: no grade band without a grade, no certificate line without a certificate.

### Don't:
- **Don't** use a grey, cream or washed-out ground; the page is warm near-black.
- **Don't** add a second accent hue, gradient glows, or gradient fills.
- **Don't** put shadows on bands, cards, wells or buttons; only floating menus get the popover drop.
- **Don't** fake the buckram weave with CSS noise or gradients; it ships as a raster with provenance or stays a flat fill.
- **Don't** set labels in uppercase tracking unless the printed object itself is uppercase (grader name, carrier, code).
- **Don't** round corners beyond 2px except functional dots and badges.
