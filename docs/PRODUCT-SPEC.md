# Openfront Collectibles: Pokémon TCG card shop, product spec

Written 2026-10-25 for the Pokémon overhaul. It records what real card shops run on, how this product models the same business, what the demo seeds, and what is deliberately left out. Every market fact below carries its source. Research notes with the full source list: the "Sources" section at the end.

## 1. Who it is for

- **The shop (merchant):** a Pokémon TCG store that sells singles by condition, graded slabs and sealed product, takes pre-orders for new sets, buys cards from customers (cash or store credit), and sells on consignment. Today these shops run TCGplayer Pro, BinderPOS (on Shopify, owned by TCGplayer since 2022), Crystal Commerce, or newer Shopify tools such as SortSwift, TCGSync and Storepass ([iCv2](https://icv2.com/articles/news/view/51599/tcgplayer-inks-deal-acquire-channelfireball-binder-pos), [Crystal Commerce](https://www.crystalcommerce.com/), [SortSwift](https://www.sortswift.com/features/autopricing)).
- **The collector (storefront):** finds a card by set and number, compares condition and price against the market, buys, sells cards to the shop, and keeps track of what they own and what they still need.

## 2. How the business works, and how the product models it

### Singles: one SKU per card × printing × language × condition
- TCGplayer's catalog is one SKU per `productId × languageId × printingId × conditionId`, with conditions NM, LP, MP, HP, Damaged ([TCGplayer API: SKUs](https://docs.tcgplayer.com/reference/catalog_getskusbyproductid.md), [conditions](https://docs.tcgplayer.com/reference/catalog_getconditions.md)). BinderPOS makes each card a Shopify product and each condition a variant ([BinderPOS price settings](https://help.tcgplayer.com/hc/en-us/articles/16007140992791-Price-Settings-and-Updates)); SortSwift uses the three Shopify options as Condition, Printing, Language ([SortSwift](https://sortswift.com/docs/csv-suite/csv-catalog/variant-generation)).
- **Model:** a `CatalogItem` is one card printing (set, number, rarity, supertype, energy types, HP, illustrator, image URLs, TCGplayer product id). A `Product` links to its `CatalogItem`; its `ProductVariant`s carry `cardCondition` (NM–DMG), `cardFinish` (normal, holofoil, reverse holofoil, 1st edition, unlimited), `cardLanguage` and `stockKind` (`raw`, `graded`, `sealed`). Raw stock is a quantity per variant, so checkout decrements it like any product.
- Condition definitions follow TCGplayer's guide; Mint/Gem Mint are not raw conditions ([Card Conditioning Overview](https://help.tcgplayer.com/hc/en-us/articles/221430307-Card-Conditioning-Overview)).

### Graded slabs: one serialized item with a grade record
- PSA grades 1–10 with half grades but no 9.5; cert pages at `psacard.com/cert/<n>`. Beckett (BGS) grades in halves with four subgrades and Pristine/Black labels. CGC has Pristine 10 above Gem Mint 10, then 9.5 and halves; cert pages at `cgccards.com/certlookup/<n>/` ([PSA cert](https://www.psacard.com/cert/68065456/), [Beckett](https://www.beckett.com/gaming-grading), [CGC scale](https://www.cgccards.com/card-grading/grading-scale/)).
- **Model:** a slab is a `Product` with one `graded` variant tied to a serialized `InventoryUnit` → `Specimen` → `GradeObservation` (grading company, grade, label, certificate, verification state) and a `certificate` identifier. Received with `receiveCollectibleItem` (which rejects PSA 9.5). The storefront shows the slab label, grade and certificate, and links to the grader's lookup only for real certificates. Checkout already reserves and converts serialized units through their listing.

### Sealed product and pre-orders
- Pokémon pre-orders at card shops are paid in full, capped per customer, and ship on street date; allocation can be short ([Poke-Collect pre-order policy](https://poke-collect.com/pages/pre-order-policy)).
- **Model:** sealed product is a `CatalogItem` of kind `sealed` (`sealedFormat`: booster box, ETB, bundle, pack…) inside its `CollectibleSet`. A pre-order variant has `preorder`, `preorderReleaseDate`, `preorderLimitPerCustomer`, and its `inventoryQuantity` is the shop's allocation. The cart enforces the limit across the customer's cart and earlier uncancelled orders (`features/keystone/lib/pokemon/preorder-limit.ts`). A set can be `releaseStatus: preorder` before its card list exists.

### Market prices and repricing
- TCGplayer Market Price is compiled from recent completed sales; low/mid/high/market are reported per product and printing ([price points](https://help.tcgplayer.com/hc/en-us/articles/222376867-What-do-the-different-price-points-on-TCGplayer-com-mean), [pricing API](https://docs.tcgplayer.com/reference/pricing_getproductprices-1.md)). The TCGplayer API no longer issues new keys ([getting started](https://docs.tcgplayer.com/docs/getting-started.md)); TCGCSV mirrors the same prices daily for free, without condition-level prices ([TCGCSV FAQ](https://tcgcsv.com/faq)).
- Shops reprice with rules: base price (market, low, mid…), a ± adjustment, a floor, and a safeguard against big swings (TCGplayer MassPrice); BinderPOS prices lower conditions as a percentage of Near Mint and rounds to .99 ([MassPrice](https://help.tcgplayer.com/hc/en-us/articles/115009826228), [BinderPOS](https://help.tcgplayer.com/hc/en-us/articles/16007140992791-Price-Settings-and-Updates)). Published sell-side curves run around LP −10 to −15%, MP −20 to −30% ([Rain City Games](https://www.raincity.games/pages/mtg-pricing-policy)).
- **Model:** `MarketPrice` is an append-only reading per card and printing (low, mid, high, market, source, observed date). `PricingRule` sets, per stock kind and condition, the basis, the percentage, a floor, rounding and a maximum change. `refreshMarketPrices` pulls today's TCGplayer prices for every set from TCGCSV; `repriceInventory` previews or applies rule prices to variants set to follow the market and lists swings past the limit for review instead of applying them. The storefront shows each card's latest reading with its date, and its history once more than one reading exists.

### Buylist and trade-ins
- Shops pay a share of market in cash or a larger share in store credit: cash about 60–70% and credit 20–30% higher, with lower shares for played copies and a per-card minimum ([Knight & Day](https://knightanddaygames.com/pages/tcg-buy-rates), [Wizard Tower](https://buylist.wizardtower.com/buylist-faq/), [TCGSync](https://tcgsync.com/buylist), [BinderPOS buylist rules](https://help.tcgplayer.com/hc/en-us/articles/21514184830615-How-to-Create-Buylist-Rules)). Online buylists are reviewed before payment ([BinderPOS approvals](https://help.tcgplayer.com/hc/en-us/articles/22682188678167-How-to-Approve-Online-Buylists)).
- **Model:** a `Buylist` holds the terms (cash %, credit %, condition shares, minimum offer, public notes). Each `BuylistEntry` targets a card printing with a minimum condition, a hotlist flag, a stock cap and NM cash/credit offers that follow the market. The storefront `/trade-in` ("Sell to us") lists offers per condition; the collector builds a sell list, picks cash or credit, and submits a `TradeInSubmission`. Listed offers are kept as estimates; staff inspect and quote on the existing trade-in desk.

### Consignment
- Commissions run about 7–20%, often tiered by price, with minimum item values and payouts days to weeks after sale ([Columbia Sports Cards](https://columbiasportscard.com/pages/consign-sports-cards), [Green Gate Hobbies](https://help.greengatehobbies.com/en/article/how-does-consignment-work-1pitnkc/)).
- **Model:** unchanged from the existing consignment lists (intake, agreement with commission and pricing authority, items, settlements). `receiveCollectibleItem` can now take a slab in on consignment with a consignor and commission.

### Collector features: binder and want list
- Card-shop platforms don't document a customer binder or want lists with alerts; collectors use apps such as Collectr ([collection apps](https://www.mydextcg.com/blog/best-pokemon-card-collection-apps-2026)). This is where the product can lead.
- **Model:** `Binder`/`BinderCard` (owner-only) record the cards a collector owns with printing, condition, grade, quantity and what they paid; the binder page totals market value, gain on recorded cost and set completion. `WishlistItem` became the want list (card, printing, worst acceptable condition, maximum price); the want list shows which wants the shop can fill now.

### Catalog and images
- Card data comes from the Pokémon TCG API's data (set ids, numbers, rarities, illustrators, image URLs on `images.pokemontcg.io`, and its successor host `images.scrydex.com` for sets after Phantasmal Flames). The free API is deprecated (keys work to 2027-03-01) ([Pokémon TCG API docs](https://docs.pokemontcg.io/)), so the repo bundles full set checklists in `features/keystone/lib/pokemon/checklists/` and imports them with `importCardCatalog`; card art is linked by URL, as card shops show stock.

## 3. The demo shop (onboarding seed)

`features/platform/onboarding/lib/seed.json`, "Eighth Street Cards" (fictional):
- 19 English sets imported as full checklists (3,074 cards) with one real TCGplayer market reading per card and printing, observed 2026-10-25 via TCGCSV: Base, Jungle, Fossil, Neo Genesis, Evolving Skies, Crown Zenith (and Galarian Gallery), 151, Paldean Fates, Surging Sparks, Prismatic Evolutions, Destined Rivals, Mega Evolution, Phantasmal Flames, Ascended Heroes, Perfect Order, Chaos Rising, Pitch Black, 30th Celebration. Delta Reign (ME06, street date 2026-11-06) is set up as a pre-order set.
- 42 singles stocked by condition (vintage holos in played grades, modern chase cards in NM), priced by the seed's pricing rules from those readings.
- 8 graded slabs (PSA, BGS, CGC). Asking prices are the shop's; **certificate numbers are labelled samples** (`SAMPLE-…`) and never link to a grader lookup. One slab is on consignment from a sample consignor.
- 16 sealed products with real market prices, including 4 Delta Reign pre-orders with allocations and per-customer limits.
- Six pricing rules (NM 100%, LP 85%, MP 70%, HP 50%, DMG 35% of market; sealed 100%) and a 15-card buylist at 60% cash / 80% credit.

## 4. Deliberately not built

- Condition-level market prices (no free source provides them; conditions price as a share of NM).
- Graded market comps (PriceCharting has graded keys but is paid; slab prices are the shop's).
- Deposits on pre-orders (card shops take full payment), automatic restock/price-alert emails, events, POS. The want list shows matches on visit; notification delivery is a later step.
- Japanese and other-language catalogs (the language field exists; TCGplayer treats Pokémon Japan as a separate line).

## Sources

Full research notes, with every source and what could not be verified, are summarised above. Unverified items: Crystal Commerce buylist mechanics, BinderPOS default condition percentages, PSA's exact half-grade list, a Beckett cert deep-link pattern, TPCi's current street-date policy text.
