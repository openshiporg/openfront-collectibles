# Openfront Collectibles

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fopenshiporg%2Fopenfront-collectibles&env=DATABASE_URL%2CSESSION_SECRET%2CS3_BUCKET_NAME%2CS3_REGION%2CS3_ACCESS_KEY_ID%2CS3_SECRET_ACCESS_KEY)

Openfront Collectibles is a self-hostable catalog and discovery application for unique physical specimens. Operators can organize inventory, condition, grading, provenance, and listing records, while collectors browse published items and follow merchant-owned detail handoffs. Collectible checkout, bidding, offers, payouts, and settlement are not launch-ready.

## Demo

![Illustrative collectible catalog artwork included in this repository](public/images/collectibles/ns-0001.svg)

Explore the application locally using the setup instructions below.

| | |
|---|---|
| **Public application** | `/[countryCode]` on your development URL |
| **Dashboard** | `/dashboard` on your development URL |

[Learn more →](https://openship.org/products/openfront-collectibles)

[Documentation →](features/keystone/models)

## The Openfront Ecosystem

Openfront is part of an ecosystem of open-source commerce tools:

- **[Openfront E-commerce](https://github.com/openshiporg/openfront)**: Headless e-commerce for retail.
- **[Openfront Restaurant](https://github.com/openshiporg/openfront-restaurant)**: Restaurant ordering, point of sale, and kitchen operations.
- **[Openship](https://github.com/openshiporg/openship)**: Order routing for multi-channel fulfillment.
- **Openfront Collectibles**: (This repository) a self-hostable catalog and discovery application for unique physical specimens.

## Core Features

### Admin Dashboard
Manage collectible commerce, gift cards, regions, currencies, collectors, products, product categories, evidence, price lists, invoices, catalog, discounts through dedicated dashboard workspaces and permission-controlled data screens.

### Storefront
Country-scoped storefront pages expose catalog browsing and collectible handoffs at `/[countryCode]/collectibles/handoff/[listingId]`. Public observation projections preserve evidence sources and review states rather than presenting provenance or grading as a software guarantee.

### Catalog & Specimens
Separate catalog definitions from individual specimens, identifiers, custody, inventory units, locations, condition observations, and media.

### Grading & Provenance Evidence
Maintain grading-company references, reported grades, certificate references, provenance events, and valuation observations with source and confidence information.

### Listing Preparation & Discovery
Prepare specimens, manage collectible listing records, and publish read-only discovery projections. Auction, consignment, buylist, and offer records are not evidence of completed money movement or active bidding.

## Architecture

### Technology Stack
- **Frontend**: Next.js 16 with App Router and React 19.
- **Backend**: KeystoneJS 6 with a GraphQL API.
- **Database**: PostgreSQL with Prisma ORM.
- **Styling**: Tailwind CSS 4 and shared shadcn/ui components.
- **Authentication**: Password-based user accounts and session-based access with role capabilities.

### Application Structure
```text
openfront-collectibles/
├── app/                    # Public pages, dashboard routes, and HTTP endpoints
├── features/
│   ├── keystone/           # Backend models, access rules, and GraphQL workflows
│   ├── platform/           # Operator workspaces and onboarding
│   ├── storefront/         # Public application components and screens
│   └── dashboard/          # Authentication and shared dashboard shell
└── components/             # Shared UI components
```

### Data Models
The [model registry](features/keystone/models/index.ts) and [Prisma schema](schema.prisma) cover:

- Categories, franchises, sets, releases, catalog items, specimens, identifiers, and media.
- Condition, grading, provenance, custody, and valuation observations.
- Inventory units, locations, movements, reservations, and listings.
- Auction, bid, offer, consignment, buylist, collector, and inherited commerce records.

## Getting Started

### Prerequisites
- Node.js 22, compatible with the [package requirements](package.json) and Next.js 16.
- A PostgreSQL database you can migrate.
- npm.

### Setup

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/openshiporg/openfront-collectibles.git
   cd openfront-collectibles
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

   Review the [example configuration](.env.example) and replace its placeholders. Keep only the local settings you need; do not copy production-mode or infrastructure examples unchanged.

   ```env
   DATABASE_URL=postgresql://user:password@host/database
   SESSION_SECRET=replace-with-a-new-private-random-secret
   ```

   Generate the session secret with `openssl rand -hex 32`; use the generated value, not the placeholder. Never commit `.env`.

   Review [runtime configuration](features/keystone/index.ts) for additional application settings before building or deploying. Configure enabled integrations separately; the two values above are not a complete production configuration.

   Production also requires configured object storage. Set `S3_BUCKET_NAME`, `S3_REGION`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY`, and supply the S3-compatible endpoint described in the source. Review mail and application-specific security settings there as well.

3. **Start development server:**
   ```bash
   npm run dev
   ```

   The development script prepares the backend schema, applies checked-in migrations, and starts Next.js.

4. **Access the application:**
   Open the URL `npm run dev` prints, then use these paths:

   - **Public application**: `/[countryCode]`
   - **Admin dashboard**: `/dashboard`
   - **GraphQL API**: `/api/graphql`

5. **Create your first admin user:**
   Visit `/dashboard/init` on an empty database to create the initial administrator, then sign in to the dashboard.

6. **Run application onboarding:**
   Configure store and regional settings, then use specimen preparation and collectible catalog workspaces to review evidence and publish eligible listings. Do not treat sample listings as verified authenticity or active auctions.

## Development Commands

- `npm run dev` - Prepare the backend schema, apply migrations, and start Next.js development.
- `npm run build` - Build the backend and Next.js for production; does not apply migrations.
- `npm start` - Start the production Next.js server.
- `npm run migrate:gen` - Prepare the schema and generate/apply development migrations.
- `npm run migrate` - Apply checked-in Prisma migrations.
- `npm run lint` - Run the repository's ESLint script.

Use a disposable development database for migration generation. Review the script before running it against any existing data.

### Discovery & Evidence Integration
The [collectible commands](features/keystone/mutations/collectibles.ts) and [public observation projection](features/keystone/mutations/collectibles-public-projection.ts) define the public handoff and evidence boundary. Existing payment or grading adapter directories do not establish a live collectibles transaction service.

## Documentation

The [backend models](features/keystone/models), [registered business workflows](features/keystone/mutations/index.ts), [access rules](features/keystone/access.ts), and [application routes](app) document the implementation in this repository.

## Security & Permissions

### Role-Based Access Control
- `canAccessDashboard` - Access dashboard.
- `canManageProducts` - Manage products.
- `canManageInventory` - Manage inventory.
- `canReadOrders` - Read orders.
- `canManageOrders` - Manage orders.

### Security Features
- Session-based authentication for signed-in users.
- Backend list access and workflow authorization, rather than dashboard visibility alone.
- Administrative access uses explicit role permissions. Machine credentials require credential scope as well as current owner-role authority; public discovery uses a separate projected listing surface.

Review the [access implementation](features/keystone/access.ts) and individual workflow checks before extending permissions.

## Platform Components

### Admin Platform (`/dashboard`)
- **Collectible Commerce**: `/dashboard/platform/collectible-commerce`.
- **Gift Cards**: `/dashboard/platform/gift-cards`.
- **Regions**: `/dashboard/platform/regions`.
- **Currencies**: `/dashboard/platform/currencies`.
- **Collectors**: `/dashboard/platform/collectors`.
- **Products**: `/dashboard/platform/products`.
- **Product Categories**: `/dashboard/platform/product-categories`.
- **Evidence**: `/dashboard/platform/evidence`.
- **Price Lists**: `/dashboard/platform/price-lists`.
- **Invoices**: `/dashboard/platform/invoices`.
- **Catalog**: `/dashboard/platform/catalog`.
- **Discounts**: `/dashboard/platform/discounts`.

### Storefront Experience
Country-scoped storefront pages expose catalog browsing and collectible handoffs at `/[countryCode]/collectibles/handoff/[listingId]`. Public observation projections preserve evidence sources and review states rather than presenting provenance or grading as a software guarantee.

Separate catalog definitions from individual specimens, identifiers, custody, inventory units, locations, condition observations, and media.

## Deployment

### Production Deployment
The Vercel button imports this application's own repository. Provision PostgreSQL and configure the application's complete runtime requirements, storage, mail, and enabled providers before building. Importing the source does not configure these services.

Build the application and apply checked-in migrations as a release step before starting the server. Back up existing data before migration.

```bash
npm run build
npm run migrate
npm start
```

The included [Railway configuration](railway.toml) defines this app's build and startup lifecycle. Provision services and secrets separately.

### Scaling Considerations
Keep the shared PostgreSQL database, session secrets, and configured object storage consistent across application processes. Review background delivery and integration requirements before choosing a serverless runtime; a source import does not supply persistent workers.

## Contributing

Use the development commands above when preparing changes. Keep model changes and their migrations together, and describe workflow and permission changes in pull requests.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).

## Support

- **Documentation**: [Source models and workflows](features/keystone/models).
- **Issues**: [Report bugs and feature requests](https://github.com/openshiporg/openfront-collectibles/issues).
- **Product**: [Learn more about Openfront Collectibles](https://openship.org/products/openfront-collectibles).

---

Built with [Next.js](https://nextjs.org) and [KeystoneJS](https://keystonejs.com).
