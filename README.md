# Legend Motors Malawi

A full-stack dealership website and operations dashboard built with Next.js, React, TypeScript, Prisma, and PostgreSQL.

## Main features

- Public dealership homepage, vehicle catalog, search and filters.
- Vehicle details pages and enquiry/contact links.
- PostgreSQL-backed inventory with publication and availability states.
- Admin login with role-based authorization and session cookies.
- Admin inventory create/edit, image URL management, publish/unpublish, status changes, and audit logging.
- Dashboard areas for customers, expenses, inventory, reports, sales, and users.

## Run locally

Requirements: Node.js 22 or newer, npm, and PostgreSQL 16 or compatible PostgreSQL.

```powershell
npm ci
```

Create a private `.env` file in the project root:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/legendmotors_dev?schema=public"
INITIAL_ADMIN_EMAIL="your-admin-email@example.com"
INITIAL_ADMIN_PASSWORD="use-a-unique-password-at-least-8-characters"
```

Use the credentials and database name for your own environment. Never commit `.env` or share secrets.

For a brand-new empty development database, apply the schema and create the initial administrator:

```powershell
npx prisma validate
npx prisma generate
npx prisma db push
npm run auth:bootstrap
```

If the database already contains data, back it up and inspect the schema before running `db push`. This repository currently does not contain Prisma Migrate migration files.

Start the app:

```powershell
npm run dev
```

Open http://localhost:3000. Sign in at `/login`; the dashboard is at `/admin`.

## Verify before release

```powershell
npm run lint
npx tsc --noEmit
npm test
npm run build
```

## Deployment

This is a **server-rendered Next.js application**, not a static-only website. GitHub Pages cannot run its API routes or Prisma/PostgreSQL backend. Deploy the full app to Vercel or another Node.js-compatible Next.js host and attach a managed PostgreSQL database.

Read [docs/deployment.md](docs/deployment.md) for environment variables, safe first-time schema setup, administrator bootstrap, and the release checklist.

## Important current limitation

The admin inventory interface stores externally hosted vehicle image URLs and metadata; it does not upload image files into persistent storage. Use a trusted HTTPS image host or implement object storage before offering direct photo uploads.
