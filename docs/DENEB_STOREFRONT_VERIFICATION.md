# Deneb storefront — 2026-11-02

## Scope and reuse
Owner-selected source: Euler's `storefront-themes/collectibles/deneb/{home-desktop,home-phone,detail-desktop}.png`; all three studied before implementation. Images remain outside this repository.

Reused this repo's `lib/data/cards.ts` public catalog/stock/market reads, `CardBuyPanel` → authorized `addToCart`, `WantToggle`, `BinderButton`, Store Settings-backed `Logo`, and existing cart dropdown. Canonical E-commerce `features/storefront/modules/layout/components/cart-button/index.tsx` inspected as the cart donor; target's existing implementation retained. No schema, migration, admin/data mutation, provider, payment, checkout or ownership changes. Feature catalog at `/Users/junaid/Code/OPENFRONT-FEATURES-CATALOG.md` was unavailable; bounded actual-source archaeology used instead.

## Presentation
Edge-to-edge six-column desktop/two-column phone art grid, black terminal palette, lime actions, compact monospace metadata, real stock totals, set-stock coverage bars and existing catalog art. Home removes the old checklist shelves not in the chosen design. Chart-led detail geometry uses real dated market readings, retaining the no-chart-until-a-week rule; purchasing is under the art, with stock and printed details on the right. Other copies retain their purchase links. Account, search, sets, buylist, cart, checkout and all pre-existing route files remain.

## Explicit gaps (not fabricated)
- No market index, biggest mover, weekly delta or recent-sales table: the demo's dated readings do not support these figures. Price delta needs price history. The schema has history support; the demo currently has a single dated observation per finish. No fake chart, volume bars, trends or grading price ladder.
- Home `Singles in stock` replaces the unsupported `Rising this week` claim. Art and order follow actual stock/prices rather than the mock's fictional values. Stock coverage is not a customer's binder completion percentage.
- Real Store Settings name/logo stay Eighth Street Cards; mock Northstar wordmarks are not copied. Settings were not modified.
- Store inventory summary replaces the mock's chart area, including on phone; this is an intentional missing-data difference, not a claim of image-identical parity.
- Source image fonts are not specified. System monospace approximates the terminal type; it is not an exact custom-font match.
- No decorative filter controls without function; home links to the existing full inventory filter workflow instead.
- No generated card art and no product photos added. Existing catalog art retained. Legal attribution and footer account/region workflows remain below the image-matched home content.

## Checks
- `npx tsc --noEmit --incremental false`: pass.
- `node --test tests/*.test.cjs`: 39 pass, 0 fail.
- `git diff --check`: pass.
- Home `cedf2db8`: Railway `112bdec6-609f-4c37-ba11-abdb423bea68` SUCCESS; live `/us` HTTP 200. Partial report sent to lead before detail work.
- Live home measured at 1440 and 402: document width equals viewport; visible home/nav text floor >=12px.
- Comparison captures are in `/Users/junaid/Code/Euler/state/screenshots/sf-collectibles-pick-vs-live-{1440,402}.png`; detail comparison uses `sf-collectibles-pick-vs-live-detail-1440.png`.
- Final deployment and route/action evidence is reported to the lead after read-back, not inferred from push.

Existing `.gitignore` addition for `.diffui/` inspected and left uncommitted. Upstream screenshot deletions arrived through `origin/master`; no screenshot/design ignores or artifacts added here. Branch fetched and rebased before implementation.
