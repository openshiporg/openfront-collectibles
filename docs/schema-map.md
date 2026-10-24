# Openfront Collectibles: schema map (2026-10-23)

Source: every `list()` in `features/keystone/models/**` (131 lists), the custom mutations and queries in `features/keystone/mutations/index.ts`, and `features/platform/onboarding/lib/seed.json`. The core commerce lists are shared with E-commerce; the collectibles lists live in `Collectible*.ts`.

Who creates a record: **M** = merchant (dashboard), **C** = customer (storefront), **S** = system (hooks, mutations, checkout, onboarding).

## Business in one paragraph
A collectibles dealer sells **one-of-one specimens**: a specific card, comic, coin, figure, watch or piece of art. Every physical object is a `Specimen` of a `CatalogItem` (the reference entry: title, set, release, maker, year). It is held as exactly one `InventoryUnit`, which is tied 1:1 to a commerce `ProductVariant`, so checkout reuses the E-commerce cart and order. Trust comes from **append-only evidence**: condition, grading certificates, provenance, custody and valuations, each attributed and carrying a disclaimer. Stock arrives by direct receipt, consignment, or trade-in/buylist. High-value orders need declared value, signature and insurance evidence. Disputes and risk are tracked separately.

## Lists

### Collectibles catalogue (`CollectibleCatalog.ts`; catalog managers write, collectibles readers read)
| List | Purpose | Key fields | Relationships | Created by | States |
|---|---|---|---|---|---|
| CollectibleCategory | Collecting category (Trading Cards, Coins…) | name, handle, status, sortOrder | parent/children, attributeDefinitions | M, S (receive) | draft → active → archived |
| AttributeDefinition | Category-specific attributes (set number, mint mark) | key, valueType, required, filterable, public, options | category | M | — |
| Franchise | Brand or IP (e.g. a game line) | name, handle, externalReferences | — | M | — |
| CollectibleSet | Set or series within a franchise | name, manufacturer, startYear, endYear | franchise | M | — |
| CollectibleRelease | Specific release/edition | name, edition, releaseDate, printRunReported | set | M | — |
| CatalogItem | Reference entry for an object type | title, handle, catalogNumber, maker, year, attributeValues, status | category, franchise, set, release, specimens, media | M, S (receive) | draft → active → archived |
| Specimen | **The physical object** | displayName, specimenCode (unique), attributeValues, lifecycleStatus (write-locked) | catalogItem, identifiers, media, condition/grade/provenance/custody/valuation observations, inventoryUnits (write-locked) | M, S (receive) | intake → review → available → reserved → sold / returned / withdrawn (only system commands move it) |
| SpecimenIdentifier | Serials, certificate numbers, registry IDs | type, issuer, value, observedAt | specimen | M | — |
| CollectibleMedia | Photos, scans, documents | kind, url, altText, visibility, source, checksum | catalogItem, specimen | M | visibility public / restricted / private |

### Inventory (`CollectibleInventory.ts`; inventory managers)
| List | Purpose | Key fields | Relationships | Created by | States |
|---|---|---|---|---|---|
| InventoryLocation | Shop, vault, warehouse, show, transit | code, name, type, publicLabel, status | — | M, S | active / inactive |
| InventoryUnit | Holding of one specimen (quantity 0–1, version fence) | sku, ownershipBasis, status, version, acquiredAmountMinor | specimen, commerceVariant, location, movements, reservations | **S only** (`receiveCollectibleItem`; API create/update denied) | intake → available → reserved → sold / return_hold / withdrawn / lost |
| InventoryMovement | Ledger of unit changes | type, fromStatus, toStatus, reason, actor, idempotencyKey | inventoryUnit, from/to location | S only | append-only |
| Reservation | Holds for cart, offer, auction, operator, return | purpose, status, expiresAt | unit, listing, cart, auction, ownerUser | S only | active → released / converted / expired / cancelled |

### Selling (`CollectibleCommerce.ts`)
| List | Purpose | Key fields | Relationships | Created by | States |
|---|---|---|---|---|---|
| Listing | Public sale of one unit | title, slug, format, status, priceMinor, currencyCode, publicSummary, publicationSnapshot; `price` (virtual) | inventoryUnit, seller, auction, offers | S (`manageCollectibleListing`, `receiveCollectibleItem`); API create/update denied | draft → published ⇄ withdrawn; scheduled, paused, sold, ended |
| Offer, OfferRevision | Buyer offers and counters | status, currentAmountMinor, expiresAt, revisions | listing, buyer, seller | C (`submitCollectibleOffer`) — **disabled** (`OFFER_LIFECYCLE_RELEASED = false`) | open → countered / accepted / declined / withdrawn / expired / converted |
| Auction, Bid | Timed auctions with reserve and soft-close | start/end, opening/current amount, reserve, increments, extensions; bid amount and status | listing, bids, leadingBidder | C (`placeCollectibleBid`) — **disabled** (`AUCTION_LIFECYCLE_RELEASED = false`) | draft → scheduled → active → ended → settled / cancelled |
| WishlistItem | Customer's saved item | notes | user (forced to owner), catalogItem, listing | C | — |
| SavedSearch | Customer's saved search | name, query, filters, notificationFrequency | user (forced to owner) | C | — |

### Consignment, buylist and trade-in (`CollectibleConsignment.ts`; consignment managers)
| List | Purpose | Key fields | Relationships | Created by | States |
|---|---|---|---|---|---|
| ConsignmentIntake | A consignor's batch handed in for sale | reference, status, submittedDescription, receivedAt, intakeObservations | consignor (SellerProfile), items, agreement | M | submitted → received → inspecting → offered → accepted / declined → returned |
| ConsignmentItem | One object in an intake | status, reserveAmountMinor, agreedPriceMinor, notes | intake, specimen, inventoryUnit | M | pending → accepted → listed → sold → settled; return_requested → returned |
| ConsignmentAgreement | Commission terms for an intake | version, status, commissionBasisPoints, fixedFeeMinor, pricingAuthority, starts/ends, termsSnapshot | intake, consignor | M | draft → sent → accepted / expired / terminated |
| ConsignmentSettlement, SettlementLine | Payout statements per consignor | gross, fee, holdback, payable; per-line commission | consignor, lines → order line items | S only (API denied; no generator exists) | pending → on_hold / approved → paid / failed / reversed |
| Buylist, BuylistEntry | What the shop is buying and for how much | name, status, currencyCode; entry offerAmountMinor, maximumQuantity, criteria, active | entries → catalogItem | M | draft → active ⇄ paused → archived |
| TradeInSubmission | A customer's trade-in | reference, status, disposition | customer, items | M (API is manager-only) | draft → submitted → received → inspecting → quoted → accepted / declined → paid / returned |
| TradeInItem | One object in a trade-in | customerDescription, customerCondition, quotedAmountMinor, acceptedAmountMinor | submission, catalogItem, specimen, inspectedConditionObservation | M | — (follows the submission) |

### Evidence (`CollectibleEvidence.ts`; evidence managers; observations are **append-only**: create, never update or delete)
| List | Purpose | Key fields | Created by |
|---|---|---|---|
| ConditionObservation | Condition notes and scores | sourceType, scale, label, score, status, publiclyVisible | M, S |
| GradingCompany | Grader registry | name, code, certificateLookupTemplate, disclaimer | M |
| GradeObservation | A reported grade and certificate | reportedGrade, reportedLabel, certificateReference, verificationState, publiclyVisible, disclaimer | M |
| ProvenanceEvent | Ownership, sale, exhibition and restoration history | eventType, occurredAt, summary, source, confidence, reviewState | M |
| CustodyEvent | Physical custody chain | type, occurredAt, from/to location, counterpartyReference | M, S |
| ValuationObservation | Comparable sales and price guides | amountMinor, sourceType, sourceName, confidence, disclaimer | M |

### Operations (`CollectibleOperations.ts`)
| List | Purpose | Created by | States |
|---|---|---|---|
| StoreMembership | Staff role in the store (owner, catalog, inventory, auctioneer, consignment, fulfillment, support, finance, viewer) | M | invited → active → suspended / revoked |
| CollectorProfile | Buyer profile: interests, preferences | C (self), M (collectible-customer managers, on a customer's behalf) | public flag |
| SellerProfile | Seller or consignor | M | applicant → active ⇄ paused → suspended / closed; identityEvidenceState |
| FulfillmentRequirement | Declared value, signature, insurance and packaging per order or line | M (fulfillment managers); create only | — |
| ShipmentEvidence | Label, scans, delivery, signature and insurance responses | M; append-only | — |
| DisputeCase | Condition, authenticity, shipping and payment disputes | M (risk managers) | open → evidence_requested → review → resolved → closed |
| EvidenceAttachment | Files attached to a dispute | M; append-only | — |
| RiskAssessment, RiskSignal | Provider risk results | S only | provider_reported / manual_review / cleared / restricted |
| ProviderConnection | Grading, valuation, identity and risk adapters | M (integration managers) | draft → configured → active / degraded / disabled |
| NotificationIntent | Outbound notification queue | S only | queued → sending → delivered / failed / cancelled |

### Core commerce (shared with E-commerce; covered by E-commerce's platform pages)
Product, ProductVariant, ProductOption(Value), ProductImage, ProductCategory, ProductCollection, ProductTag, ProductType, MoneyAmount, PriceList, PriceRule, PriceSet, RuleType · Cart, LineItem (+TaxLine, Adjustment), ShippingMethod (+TaxLine), PaymentCollection, PaymentSession, Payment, Capture, Refund · Order, OrderLineItem, OrderMoneyAmount, OrderEvent, Note, DraftOrder, Fulfillment, FulfillmentItem, ShippingLabel, Return, ReturnItem, ReturnReason, ClaimOrder, ClaimItem, ClaimImage, ClaimTag, Swap · Region, Country, Currency, TaxRate, TaxProvider, ShippingOption, ShippingOptionRequirement, ShippingProfile, ShippingProvider, CustomShippingOption, FulfillmentProvider, PaymentProvider, Location, StockMovement, Measurement · Discount, DiscountRule, DiscountCondition, GiftCard, GiftCardTransaction · User, Role, Team, Invite, Address, CustomerGroup, UserField, Account, AccountLineItem, Invoice, InvoiceLineItem, BusinessAccountRequest · Store, SalesChannel, ApiKey, OAuthApp, OAuthToken, WebhookEndpoint, WebhookEvent, Notification, NotificationProvider, BatchJob, IdempotencyKey.

### Custom mutations and queries (collectibles)
- `receiveCollectibleItem(input)`: catalog entry + specimen + condition + unit + receipt movement, plus an optional published listing, for an existing product variant. Used by onboarding only before this pass.
- `manageCollectibleListing(input)`: create / update_draft / publish / withdraw a fixed-price listing (version-fenced, idempotent).
- `publicCollectiblesDiscovery(input)`, `marketplaceCollectiblesCapabilities`: public listing search and projection.
- `placeCollectibleBid`, `submitCollectibleOffer`: disabled until the lifecycles are released.
- Shared commerce: `createActiveCart`, `updateActiveCart`, `addActiveCartShippingMethod`, `initiatePaymentSession`, `completeActiveCart` (manual tender refused), `activeCartPaymentProviders`, `getCustomerOrders`, and so on.

## Merchant workflows → lists
1. **Receive stock:** create product + variant (SKU) → `receiveCollectibleItem` → CatalogItem, Specimen, ConditionObservation, InventoryUnit, InventoryMovement (+ Listing).
2. **Document an item:** Specimen → SpecimenIdentifier, CollectibleMedia, ConditionObservation, GradeObservation (GradingCompany), ProvenanceEvent, CustodyEvent, ValuationObservation (`publiclyVisible` feeds the storefront item record).
3. **List and sell:** Listing via `manageCollectibleListing` → storefront product page → Cart → Order (core) → InventoryUnit / Specimen to sold (system).
4. **High-value fulfilment:** paid Order → FulfillmentRequirement (declared value, signature, insurance) → Fulfillment (core) → ShipmentEvidence (label, scans, delivery, signature).
5. **Consignment:** SellerProfile (consignor) → ConsignmentIntake → ConsignmentItem(s) → ConsignmentAgreement (draft → sent → accepted) → items listed and sold → ConsignmentSettlement (payout).
6. **Buylist and trade-in:** Buylist + BuylistEntry (what we buy) → TradeInSubmission + TradeInItem → receive, inspect (ConditionObservation), quote → accepted → paid / returned.
7. **Disputes:** Order → DisputeCase → EvidenceAttachment → review → resolution.
8. **Sellers and collectors:** SellerProfile approval (applicant → active); CollectorProfile.
9. **Auctions and offers:** Auction / Bid, Offer / OfferRevision. Their state machines are not released; customer commands throw.
10. **Core commerce:** products, orders, returns and claims, regions, payments, shipping, discounts, gift cards, users, business accounts (E-commerce parity).

## Customer workflows → lists
1. Browse / search → product detail with item record (public projection) → cart → checkout → order confirmation → account orders. Checkout completion needs Stripe keys; see the coverage report.
2. Wishlist: WishlistItem (owner-forced).
3. Saved searches: SavedSearch (owner-forced).
4. Trade-in: Buylist → TradeInSubmission / TradeInItem. API access is manager-only, so a customer path needs a dedicated mutation.
5. Collector profile: CollectorProfile (self).
6. Offers and bids: disabled (see 9 above).

## Coverage (before this pass)
| Workflow / list | Platform page | Status |
|---|---|---|
| Core commerce (orders, products, inventory, categories, collections, regions, payments, shipping, discounts, gift cards, price lists, users, business accounts, claims, API keys, apps, store) | `/dashboard/platform/*` E-commerce slices | Covered |
| Receive stock (`receiveCollectibleItem`) | none (onboarding only) | **MISSING** |
| Specimens and their evidence | Catalog desk queue + generic `/dashboard/specimens` | **THIN**: no item record, no evidence timeline, no add-evidence actions |
| Catalog items, categories, franchises, sets, releases, attributes, grading companies, locations | Catalog desk + generic lists | Covered (reference data; generic CRUD is the job) |
| Inventory units, movements, reservations, custody | Inventory desk (read-only by design) | Covered (system-written) |
| Listings | Listings desk + `ManagedListings` (create / edit / publish / withdraw) | Covered |
| Offers, auctions, bids | Listings and Auctions desks (read-only) | Covered read-only; commands disabled by design |
| Consignment intake → items → agreement | Consignment desk + generic lists | **THIN**: no intake record, no transitions, no item/agreement actions |
| Consignment settlements | Consignment desk (read-only) | Read-only by design (no generator) |
| Buylists and entries | Buylist desk + generic lists | Covered (reference data) |
| Trade-in submissions | Buylist desk + generic lists | **THIN**: no record, quote or transitions |
| Condition and grading review | Evidence desk | **THIN** (covered once the item record exists) |
| High-value fulfilment | Fulfilment desk (read-only queues) | **THIN**: cannot set requirements or record shipment evidence |
| Disputes | Evidence desk queue + generic list | **THIN**: no case record or transitions |
| Seller approval | Collectors desk + generic list | **THIN**: no approve / pause / suspend actions |
| Collector profiles | Collectors desk + generic create | Covered |
| Store memberships, provider connections | generic lists | Covered (settings) |
| Risk assessments, notification intents | generic lists (read-only) | Covered (system logs) |
| Join tables, logs, system lists (OfferRevision, SettlementLine, InventoryMovement, ShipmentEvidence, EvidenceAttachment, OrderEvent, IdempotencyKey…) | parent pages | Covered by parent |

**Storefront (before):** browse, search, product + item record, cart, checkout, confirmation and account orders exist. **MISSING:** wishlist, saved searches, trade-in (buylist → submission → account history), collector profile.

## Coverage (after this pass)
| Workflow / list | Platform page | Status |
|---|---|---|
| Receive stock | `/dashboard/platform/items/receive` (`collectible-items`) → `receiveCollectibleItem` | Covered |
| Specimens and evidence | `/dashboard/platform/items`, `/items/[id]` (`collectible-items`): lifecycle track, item record, evidence timeline, add identifier / condition / grade / provenance / custody / valuation / media | Covered |
| Consignment intake → items → agreement | `/dashboard/platform/consignments`, `/consignments/[id]` (`consignments`): server-checked transitions for intakes, items and agreements | Covered |
| Consignment settlements | shown read-only on the consignment and seller pages | Read-only by design (no generator) |
| Trade-in submissions | `/dashboard/platform/trade-ins`, `/trade-ins/[id]` (`trade-ins`): transitions, per-item quotes prefilled from the buylist, inspection observations | Covered (payout only marks paid) |
| High-value fulfilment | `/dashboard/platform/high-value-fulfillment`, `/[orderId]` (`high-value-fulfillment`): requirements queue, set/replace requirements, record shipment evidence | Covered |
| Disputes | `/dashboard/platform/disputes`, `/disputes/[id]` (`disputes`): transitions, resolution, assignee, evidence | Covered |
| Seller approval | `/dashboard/platform/sellers`, `/sellers/[id]` (`sellers`): approve / decline / pause / resume / suspend / reinstate / close, identity state | Covered |
| Offers, auctions, bids | desks (read-only) | Commands disabled until the lifecycles are released |
| Everything else | unchanged from the table above | Covered |

**Storefront (after):** wishlist (product toggle, `/account/wishlist`), saved searches (search page, `/account/saved-searches`), trade-in (`/trade-in` buylist and submission, `/account/trade-ins` history) and collector profile (account profile) are added. The new commands are `toggleWishlistListing`, `activeWishlist`, `publicBuylist`, `submitTradeIn` and `activeTradeIns` (`features/keystone/mutations/collectibles-customer.ts`). Saved searches and collector profiles use owner-scoped CRUD.
