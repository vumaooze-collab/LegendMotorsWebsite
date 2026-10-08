# Legend Motors platform architecture

## Audit summary

The repository is a polished public-facing Next.js 16 dealership landing page. The current implementation already includes a strong visual identity, high-quality hero imagery, dealership service sections, a header/footer, and a demo inventory catalog that supports filters and a vehicle detail modal.

The app is not yet a dealership operating system. It currently uses static demo data in `data/vehicles.ts`, with no database, no server-side business logic, no auth, no admin shell, and no inventory persistence.

## Foundation plan

1. Preserve the public website styling and marketing experience.
2. Introduce a shared source of truth for inventory and finance logic.
3. Add a PostgreSQL-first schema and Prisma client for dealership records.
4. Create admin dashboard pages and inventory workflows on top of the shared business logic.
5. Add API routes for public data and administrative tasks.
6. Expand to sales, expenses, reports, social, and assistant features only after the data layer is stable.

## Core implementation rules

- Do not duplicate inventory state between the public site and the admin app.
- Do not place business formulas in UI components.
- Use Decimal-based pricing in the database model rather than floating-point values.
- Maintain access checks on the server, not only in the UI.
- Build features in the specified dependency order.

## Current phase completion

- Repository audit complete.
- Core public site preserved.
- Shared inventory and finance modules added.
- PostgreSQL schema scaffold added in `prisma/schema.prisma`.
- Admin dashboard and inventory management shell added.
