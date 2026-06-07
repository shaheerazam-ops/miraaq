# Miraaq — Luxury Perfume E-Commerce Platform

A production-ready luxury Middle Eastern perfume e-commerce platform built with Next.js 15, featuring an interactive 3D hero, Stripe payments, and a full admin dashboard.

![Miraaq](https://images.unsplash.com/photo-1541643600914-78b084683601?w=1200&q=80)

## Features

- **Interactive 3D Hero** — React Three Fiber perfume bottle with golden particles, mouse parallax, and fragrance notes
- **Full E-Commerce** — Product catalog, filters, cart, checkout with Stripe (Visa, Mastercard, Apple Pay, Google Pay)
- **Authentication** — NextAuth with credentials + Google OAuth, JWT sessions, role-based access
- **User Dashboard** — Orders, wishlist, addresses, account settings
- **Admin Dashboard** — Analytics, product/order/user management, inventory, coupons, review moderation
- **Luxury Design** — Black, gold, ivory, emerald palette with premium typography and animations
- **SEO Optimized** — Metadata, OpenGraph, structured data, sitemap, robots.txt
- **Security** — Rate limiting, CSRF protection, Zod validation, bcrypt hashing, security headers
- **Docker Ready** — Multi-stage Dockerfile and docker-compose with PostgreSQL

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS, ShadCN UI |
| 3D | Three.js, React Three Fiber, Drei |
| Animation | Framer Motion |
| Database | PostgreSQL, Prisma ORM |
| Auth | NextAuth v5 |
| Payments | Stripe |
| Images | Cloudinary |
| State | Zustand |
| Validation | Zod |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Stripe account (for payments)
- Cloudinary account (for image uploads)

### Installation

```bash
# Clone and install
git clone <repository-url>
cd miraaq
npm install --legacy-peer-deps

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Setup database
npm run db:generate
npm run db:push
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@miraaq.com | Admin@123456 |
| Customer | customer@miraaq.com | User@123456 |

### Coupon Codes

- `WELCOME10` — 10% off orders over $100
- `MIRAAQ25` — $25 off orders over $200

## Docker Deployment

```bash
# Start PostgreSQL
docker compose up postgres -d

# Run migrations
docker compose --profile migrate run migrate

# Build and start app
docker compose up app -d
```

## Project Structure

```
Miraaq/
├── app/
│   ├── (auth)/          # Login, register, forgot password
│   ├── (dashboard)/     # User dashboard
│   ├── (storefront)/    # Public pages (shop, cart, about)
│   ├── admin/           # Admin dashboard
│   └── api/             # API routes
├── src/
│   ├── components/      # UI and feature components
│   ├── lib/               # Utilities, auth, db, stripe
│   ├── services/          # Business logic
│   └── types/             # TypeScript types
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed data
├── Dockerfile
└── docker-compose.yml
```

## Environment Variables

See [`.env.example`](.env.example) for all required variables.

Key variables:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — Auth secret (min 32 chars)
- `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe keys
- `CLOUDINARY_*` — Cloudinary credentials

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbo |
| `npm run build` | Production build |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript check |

## API Routes

- `GET/POST /api/products` — Product catalog
- `POST /api/orders` — Create order
- `POST /api/checkout` — Stripe checkout session
- `POST /api/webhooks/stripe` — Stripe webhooks
- `GET /api/admin/analytics` — Admin analytics
- And 20+ more endpoints — see `app/api/`

## License

Proprietary — Miraaq © 2026
