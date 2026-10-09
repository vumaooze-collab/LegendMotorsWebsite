# Legend Motors platform architecture

## Overview

Legend Motors is a full-stack Next.js App Router application using React, TypeScript, Prisma, and PostgreSQL. The public dealership website and the admin dashboard run in the same Next.js application so they share one inventory source of truth.

## Stack

- **Frontend and server:** Next.js 16 App Router, React 19, TypeScript.
- **Styling:** CSS and Tailwind CSS 4 tooling.
- **Database access:** Prisma Client 6 and PostgreSQL.
- **Validation:** Zod schemas for vehicle, publication, status, and image inputs.
- **Authentication:** bcrypt password verification, random session tokens stored as hashes, HTTP-only session cookie, seven-day expiry, and server-side role/permission checks.
- **Tests:** Node test runner via `tsx --test`, including an opt-in PostgreSQL integration test.

## Public routes

- `/`: dealership home page and inventory catalog.
- `/vehicles`: full vehicle catalog and filters.
- `/vehicles/[id]`: vehicle detail page.
- `/api/vehicles`: public listing API with query and filter support.
- `/api/vehicles/[id]`: public vehicle detail API.

Only published vehicles with AVAILABLE or RESERVED status are returned publicly. Public vehicle DTOs omit internal stock and publication fields.

## Admin routes and capabilities

- `/login`: administrator/staff sign-in.
- `/admin`: protected dashboard.
- `/admin/inventory`: database-backed inventory administration.
- Additional dashboard sections exist for customers, expenses, reports, sales, and users.
- `/api/admin/inventory` and nested routes support listing, creation, editing, status changes, publishing, archiving, and image metadata operations.
- Mutating inventory operations use role/permission checks and write audit records.

The initial administrator is created by `npm run auth:bootstrap`, which requires `INITIAL_ADMIN_PASSWORD` and optionally uses `INITIAL_ADMIN_EMAIL`. Never commit these values.

## Database

The Prisma schema defines users, roles, sessions, business settings, vehicles, vehicle images and documents, customers, suppliers, enquiries, sales, sale items, expense categories, expenses, payments, inventory transactions, social accounts, assistant conversations/messages, notifications, and audit logs.

This repository currently has no Prisma Migrate migration directory. Existing databases must be backed up and inspected before any schema push. For a new empty database, `npx prisma db push` can apply the schema as documented in [deployment.md](deployment.md).

## CI and deployment

GitHub Actions runs Prisma generation, applies the schema to a disposable PostgreSQL service, then runs lint, TypeScript checks, tests, and the production build.

The application requires a Node.js-compatible Next.js host and persistent PostgreSQL. GitHub Pages is not suitable for the full app because it cannot execute API routes, session authentication, or Prisma queries.

## Known release limitation

The admin image UI saves externally hosted HTTPS image URLs and image metadata. It does not upload image binaries to persistent storage. Direct upload support requires a configured object-storage provider and authenticated upload implementation.

## Release acceptance checks

1. CI passes lint, type-check, tests, and build.
2. Production database schema is applied intentionally and admin bootstrap succeeds.
3. Admin can create and edit a vehicle, manage images, change status, and publish/unpublish.
4. Public catalog and detail pages display only published AVAILABLE/RESERVED vehicles.
5. Vehicle detail, enquiry, login, logout, and permission behavior are tested on the deployed domain.
6. The dealership verifies all live prices, specifications, photos, contact details, and availability before publication.
