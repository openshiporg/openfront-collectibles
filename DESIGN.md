---
name: Openfront Collectibles Storefront
description: The shop is a set checklist; numbered paper-white rows printed on black stock, ticked in card-border yellow where the shop holds a copy.
colors:
  checklist-yellow: "hsl(50 92% 60%)"
  checklist-yellow-lit: "hsl(50 95% 70%)"
  yellow-tint: "hsl(50 35% 14%)"
  stock-black: "oklch(14.5% 0.003 265)"
  sheet-band: "oklch(19% 0.004 265)"
  band-raised: "oklch(22% 0.004 265)"
  art-well: "oklch(11% 0.003 265)"
  hairline: "oklch(30% 0.004 265)"
  field-stroke: "oklch(34% 0.004 265)"
  paper-ink: "oklch(95.5% 0.006 95)"
  paper-ink-2: "oklch(81% 0.01 95)"
  paper-ink-3: "oklch(68% 0.006 265)"
  struck-ink: "oklch(54% 0.005 265)"
  market-up: "oklch(80% 0.15 150)"
  market-down: "oklch(72% 0.17 27)"
  slab-label-paper: "oklch(96% 0.006 95)"
  slab-label-ink: "oklch(20% 0.02 265)"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "72px"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 87.5"
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "36px"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  body-lead:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.45
  number:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    letterSpacing: "0"
    fontFeature: "'tnum', 'lnum'"
    fontVariation: "'wdth' 87.5"
  stamp:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    letterSpacing: "0.02em"
    fontFeature: "'tnum', 'lnum'"
    fontVariation: "'wdth' 75"
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.33
rounded:
  none: "0px"
  shell: "2px"
  slab-label: "3px"
  slab-case: "10px"
  card-corner: "4.5% / 3.2%"
spacing:
  hair: "2px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.checklist-yellow}"
    textColor: "{colors.stock-black}"
    typography: "{typography.title}"
    rounded: "{rounded.shell}"
    padding: "0 24px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.checklist-yellow-lit}"
  button-row-add:
    backgroundColor: "{colors.checklist-yellow}"
    textColor: "{colors.stock-black}"
    rounded: "{rounded.none}"
    padding: "0 14px"
    height: "36px"
    width: "64px"
  button-line:
    backgroundColor: "transparent"
    textColor: "{colors.paper-ink}"
    rounded: "{rounded.none}"
    padding: "0 14px"
    height: "36px"
  tick-in:
    backgroundColor: "{colors.checklist-yellow}"
    textColor: "{colors.stock-black}"
    rounded: "{rounded.none}"
    size: "18px"
  tick-out:
    backgroundColor: "transparent"
    rounded: "{rounded.none}"
    size: "18px"
  run-cell:
    backgroundColor: "transparent"
    textColor: "{colors.paper-ink-3}"
    rounded: "{rounded.none}"
    padding: "0 4px"
    height: "26px"
    width: "31px"
  run-cell-selected:
    backgroundColor: "{colors.checklist-yellow}"
    textColor: "{colors.stock-black}"
  pill:
    backgroundColor: "{colors.sheet-band}"
    textColor: "{colors.paper-ink-2}"
    rounded: "{rounded.shell}"
    padding: "0 14px"
    height: "40px"
  pill-active:
    backgroundColor: "{colors.checklist-yellow}"
    textColor: "{colors.stock-black}"
  input:
    backgroundColor: "{colors.stock-black}"
    textColor: "{colors.paper-ink}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "40px"
  nav-bar:
    backgroundColor: "{colors.art-well}"
    textColor: "{colors.paper-ink-2}"
    height: "64px"
  slab-label:
    backgroundColor: "{colors.slab-label-paper}"
    textColor: "{colors.slab-label-ink}"
    rounded: "{rounded.slab-label}"
    padding: "8px 10px"
---

# Design System: Openfront Collectibles Storefront

## Overview

**Creative North Star: "The Set Checklist"**

Every set is a numbered sheet printed on black checklist stock. Rows are paper-white type on hairline rules; each one carries a tick box, the collector number, the card's name, its rarity mark, a condition run, the dated market reading, the shop's price and an Add. A card opens from its number: on a pointer the art slides out of the number slot beside the row, on touch tapping the number opens it in place. Lists everywhere (home shelves, set pages, the buylist, the binder) are the same sheet read for a different purpose; the buylist is the sheet read as what the shop is buying.

The page is dense the way a printed checklist is dense: one fixed column grid, tabular numbers, no card-grid chrome. Colour is withheld so the set logos and card art carry it; the only ink accent is card-border yellow, the store's own logo hue, set per store. Depth is nearly absent: the sheet is flat, a hovered row lifts one step in tone, and the only objects that read as physical are the things being sold (the card with its rounded corners, the graded slab, the sealed box end).

The world rejects the marketplace grid of identical product cards and the holographic-gradient glow page.

**Key Characteristics:**
- Black stock, paper-white rows, hairline rules; a 2px ink rule opens every sheet and every section.
- One control shape: the square tick box, with a state ramp (solid in stock, hollow out, dashed wanted or pre-order).
- One accent, card-border yellow, hue-driven from the store's logo colour.
- Archivo throughout: condensed cut for numbers, codes and stamps, normal width for names and reading.
- Square corners on everything the shop prints; rounded corners only on depicted objects (cards, slabs).
- Motion is printing: rows print in by number once, a tick inks in, the card slides out of its slot.

## Colors

One accent on near-neutral black and paper-white; set logos and card art are the only other colour.

### Primary
- **Card-Border Yellow** (checklist-yellow): ticks of held stock, the primary action (Add, Add to cart, Sell cards to us), the selected condition, the active filter pill, the completion strip's held cells, focus rings, text selection, the caret. Its hue is the store's saved logo hue (`--cx-h`, default 50); saturation and lightness are fixed so every store keeps the same contrast against black.
- **Lit Yellow** (checklist-yellow-lit): hover state of the large primary button only.
- **Yellow Tint** (yellow-tint): rare dark ground for an applied code chip; not a surface colour.

### Neutral
- **Checklist Stock** (stock-black): the page; also the text colour on yellow.
- **Sheet Band** (sheet-band): hovered or focused row, bands holding rows, dropdown and modal surfaces, idle pills.
- **Raised Band** (band-raised): hover on nav items and pills; muted fills.
- **Art Well** (art-well): the nav bar, behind card art, the sealed box face.
- **Hairline** (hairline): every rule between rows, field strokes on the sheet, empty completion cells.
- **Field Stroke** (field-stroke): the shell's form input stroke.
- **Paper Ink** (paper-ink): names, prices, headings, the 2px sheet-opening rule.
- **Paper Ink 2** (paper-ink-2): secondary text, sold-out names, idle nav items, the tick's hollow border.
- **Paper Ink 3** (paper-ink-3): column heads, market dates, out-of-stock tick borders, dead run cells.
- **Struck Ink** (struck-ink): disabled, struck pill text.

### Market and slab
- **Market Up / Market Down** (market-up, market-down): price-history movement and changed-price cells only, never decoration.
- **Slab Label Paper / Ink** (slab-label-paper, slab-label-ink): the grader's label band on a graded slab; the one light field on the page, because the object being depicted has one.

### Named Rules
**The One Ink Rule.** Card-border yellow is the only accent. It marks what the shop holds and what the collector can do next; it never fills a background band, a heading, or a decorative field. A chosen option that is not a buy action (a "have" or a filter in a form) is selected in paper ink, not yellow.

**The Store Hue Rule.** The accent's hue comes from the store's logo colour on the shell wrapper; never hard-code a yellow hex in storefront code.

**The Art Carries Colour Rule.** Set logos and card art are the page's colour. Gold rarity stars use the accent because the card prints them gold; nothing else borrows it for ornament.

## Typography

**Display Font:** Archivo (with ui-sans-serif, system-ui)
**Body Font:** Archivo
**Label/Mono Font:** Archivo on its width axis (condensed 87.5% for numbers, 75% for stamps)

**Character:** One grotesque family used like a printed checklist: names and reading at normal width, every number, code, grade and stamp in the condensed cut with tabular lining figures so columns align.

### Hierarchy
- **Display** (800, 44px phone / 64px small / 72px desktop, 0.95, condensed 87.5%): the store's name on home, card and product names on detail pages.
- **Headline** (800, 30px phone / 36px desktop, 1.05): section titles under a 2px ink rule.
- **Title** (600-700, 15px): row names, set names, list titles.
- **Body** (400, 15px, 1.5, max 60ch) and **Lead** (400, 17px, 1.45, max 40ch): notes and the home one-liner.
- **Number** (600, 12-34px, condensed 87.5%, tabular): collector numbers, prices, counts, market readings; the "N of M in stock" count runs 34px bold.
- **Stamp** (700, 10-15px, condensed 75%, uppercase, 0.02-0.04em): set codes, grader names, grade labels, the pre-order stamp, rarity text marks, box-end codes (scaled to 56-140px on sealed product).
- **Label** (600, 12-14px, paper-ink-3): column heads and field labels; sentence case.

### Named Rules
**The Condensed Number Rule.** Every number a collector compares (No., price, market, count, grade) sets in the condensed tabular cut; names never do.

**The Stamp Is Data Rule.** Uppercase stamps label a datum (a code, a grade, a state). They never sit above a heading as a section label.

## Layout

A single column of sheets at a 1320px maximum width with 16px gutters on phones and 24px from 640px. Home opens on a two-column split at desktop (about 38% / 62%): the store's name, one line, the search and the numbered set index on the left; the featured set's sheet on the right. Below, sections stack as shelves: a 2px paper-ink rule, a headline with its link on the right (underlined in yellow), an optional 60ch note, then a sheet or a grid.

The sheet is one fixed column grid shared by every list. At 768px and up: tick 18px, number 52px, name flexible, rarity 30px, condition run 166px, market 76px, price 80px, action 64px, with 12px column gaps and 48px minimum rows. On phones the same row folds into three lines (tick, number, name, price; then rarity and Add; then the run) with 52px minimum rows. Column heads show only at 768px and up.

Image grids (slabs, sealed, art) run 2 columns on phones, 3 from 640px and 5 from 1024px, with 24/12px and 28/16px gaps. Spacing steps are 4, 8, 12, 16, 24 and 48px; touch targets are at least 40px on phones (44px for pills and nav icons).

**The One Grid Rule.** Every list of cards uses the sheet's column grid (No., Name, Rarity, Run, Market, Price); a changed price restyles its cell without breaking the grid.

**The Kept Place Rule.** A sold-out card keeps its row and number, its name struck through, offering the want list; the sheet never closes up.

## Elevation & Depth

The sheet is flat. Depth is conveyed by tone, one step at a time: stock-black page, sheet-band for a hovered or focused row and for bands, art-well for recessed fields behind art. The only drawn depth belongs to depicted objects: the graded slab's case is drawn with inset rings, the sealed box end with an inset hairline and a 10px foot band. Floating overlays (the nav's More menu, the cart dropdown, modals) carry one soft drop shadow so they separate from the sheet beneath.

### Shadow Vocabulary
- **Slab case** (`inset 0 0 0 1px color-mix(in oklch, ink 28%, transparent), inset 0 0 0 6px color-mix(in oklch, ink 4%, transparent)`): the clear plastic case of a graded slab.
- **Box end** (`inset 0 0 0 1px hairline, inset 0 -10px 0 sheet-band`): the sealed product face.
- **Line button** (`inset 0 0 0 1px paper-ink-3`, ink on hover): the outlined secondary action; a stroke, not elevation.
- **Overlay** (`0 24px 48px -16px rgb(0 0 0 / 0.7)`): dropdowns and modals only.

### Named Rules
**The Flat Sheet Rule.** Nothing printed on the sheet casts a shadow and nothing glows. Elevation belongs to objects being sold and to overlays that float above the page.

## Shapes

Square by default. Everything the shop prints (rows, tick boxes, condition-run cells, row buttons, inputs, selects, stamps, box ends) has 0 radius; the shell's larger controls (primary button, pills, nav items, bands, dropdowns) round to a near-square 2px. Rounded geometry is reserved for the physical objects in the world: card art at the card's own corner ratio (4.5% / 3.2%, aspect 63:88), the slab case (10px) and its label (3px), the slab window (4px). Rarity marks are drawn as the card prints them: circle, diamond, star.

Rules are the main line work: 1px hairlines between rows, a 2px paper-ink rule opening every sheet and shelf, a 1.5px stroke on the tick box. A diagonal hatch (1px hairline every 7px) fills a card's art well when no image exists.

**The Square Tick Rule.** The tick box is the one control shape. Its state ramp is the vocabulary for stock and intent: solid yellow with an inked check for in stock or owned, hollow paper-ink-3 for out, dashed yellow for wanted or pre-order, hairline for not stocked.

## Components

### Buttons
Blunt and printed, never pill-shaped.
- **Shape:** square in the sheet (0px), near-square in the shell (2px).
- **Primary:** yellow fill with stock-black text, 700 weight. Shell size 48px high, 24px side padding, 17px; row Add 64px wide by 36px (40px on phones), 14px condensed.
- **Hover / Focus:** large primary lightens to lit yellow; row buttons brighten 8%. Press scales to 0.97. Focus is a 2px yellow outline offset 2-3px.
- **Line:** transparent with a 1px paper-ink-3 inset stroke, paper ink on hover; used for Want, "I have this", "Full checklist" links.
- **Disabled:** 40-45% opacity, no transform.

### Chips (pills)
- **Style:** sheet-band fill, paper-ink-2 text, 15px 600, 40px high (44px on phones), 2px radius, in a scrolling track with 4px gaps.
- **State:** active pill is yellow with stock-black text; unavailable pills are struck through in struck-ink.

### Cards / Containers
- **Corner Style:** none on sheets; 2px on bands.
- **Background:** the page itself; rows take sheet-band on hover or focus.
- **Shadow Strategy:** flat (see Elevation & Depth).
- **Border:** a 2px paper-ink rule on top, 1px hairlines between rows.
- **Internal Padding:** rows 6px vertical (10px on phones), 12px column gaps.

### Inputs / Fields
- **Style:** 40px high, 1px hairline stroke, stock-black fill, 14px paper ink, paper-ink-3 placeholder, yellow caret, square corners. Selects carry a drawn chevron at 12px from the right.
- **Focus:** 2px yellow outline offset 1px. An active filter select keeps a yellow stroke with a 2px yellow underline.

### Navigation
- **Style:** sticky 64px bar on art-well, 1320px container. Logo left, links centred in Archivo 16px: "Sets" bold in paper ink, others 600 in paper-ink-2, turning paper ink on a raised-band hover with 2px corners. Search icon, "Sell to us", "Account" and Cart on the right; the cart count is a condensed number.
- **Mobile:** links collapse into a side menu behind a menu button; search and cart stay in the bar at 44px.

### Checklist Row (signature)
The row is the product. Tick, condensed number, name with its set and finish under it, rarity marks, the condition run, the market reading with the date it was read beneath it, the price, Add. On pointer hover or number focus the card art (132px wide, rotated -3deg) slides out of the number slot over 300ms; under reduced motion it fades. On touch, tapping the number opens the art (148px) in place below the row. Rows print in by number once (520ms, 28ms stagger) and held ticks ink in.

### Condition Run (signature)
Read like a size run: NM, LP, MP, HP, DMG cells, 31 by 26px, 2px apart, hairline stroked, 12px condensed. A live cell is a buy target in paper ink; a dead cell is struck through; the selected cell fills yellow (or paper ink when the choice is not a purchase).

### Graded Slab and Box End (signature)
A graded slab is drawn as its case: the light grader's label (grader stamp, card name, year, set and number, the grade large in the 75% cut) over the card in its window, the certificate beneath it marked as a sample record when it is one. Sealed product is drawn as its box end: the set code stamped large, the product type, set and date, the logo small at the foot; a pre-order carries the street date on a dashed yellow stamp, never a yellow field.

### Completion Strip
One cell per card number, 1px apart, 14px high (folding onto two 22px rows on phones for long sets); held numbers in yellow, the rest hairline.

## Do's and Don'ts

### Do:
- **Do** put every list of cards on the sheet grid, with the number first and the price right-aligned in the condensed tabular cut.
- **Do** keep sold-out rows in place, struck through, with Want as the action.
- **Do** show every market reading with its date beneath it.
- **Do** derive the accent from the store's logo hue (`hsl(var(--cx-h) 92% 60%)`), and use it only for held stock, the next action, selection and focus.
- **Do** open sections with a 2px paper-ink rule and a headline, with the section's link underlined in yellow.
- **Do** mark pre-orders with the dashed stamp and dashed tick.
- **Do** read the slice's `--tc-*` tokens in card UI; the storefront shell (`.cx-sf`) maps them to the checklist stock, and platform pages map them to the dashboard theme.

### Don't:
- **Don't** build a marketplace grid of identical product cards for singles; grids are for objects (slabs, sealed product, art).
- **Don't** use holographic, foil or glow gradients, or any colour gradient, on the page.
- **Don't** fill bands, headings or pre-order fields with yellow.
- **Don't** give printed elements (rows, ticks, run cells, inputs) rounded corners or shadows.
- **Don't** set names in the condensed cut or numbers at normal width.
- **Don't** place uppercase stamps above headings as section labels.
- **Don't** introduce a second display or serif face; Archivo is the only family.
