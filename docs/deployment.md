# Legend Motors deployment and handoff

## Application architecture

Legend Motors is a full-stack Next.js application. The public pages and admin dashboard use server-side API routes, Prisma, and PostgreSQL. It **cannot be deployed as a fully working application to GitHub Pages**, which only serves static files.

Recommended hosting:
- **Web application:** Vercel (or another host that supports the Next.js Node.js runtime).
- **Database:** managed PostgreSQL reachable from the web host.
- **Vehicle photos:** use HTTPS image URLs from a reliable image host for now. The admin UI currently stores image URLs and metadata; it does not upload binary image files to storage.

## Required environment variables

Configure these in the hosting provider's project settings; do not commit the real values.

- `DATABASE_URL`: connection string for the production PostgreSQL database.
- `INITIAL_ADMIN_EMAIL`: the administrator email to create.
- `INITIAL_ADMIN_PASSWORD`: a unique password of at least 8 characters. Use a strong, unique password for production.

The administrator bootstrap script updates the account matching `INITIAL_ADMIN_EMAIL` with the supplied password. Run it only when intentionally creating or resetting that administrator's credentials.

## First-time production setup

1. Create a **new, empty** managed PostgreSQL database and keep its connection string private.
2. Connect the project to the host and configure all required environment variables.
3. From a trusted terminal with the production `DATABASE_URL` set, review the schema and confirm the database is empty before applying the schema:
   ```powershell
   npx prisma validate
   npx prisma generate
   npx prisma db push
   ```
   `db push` applies the Prisma schema directly. Do not run it against a database containing valuable data without first taking a backup and reviewing the proposed changes.
4. Bootstrap the administrator:
   ```powershell
   npm run auth:bootstrap
   ```
5. Deploy the application and verify `/login`, `/admin`, `/vehicles`, and `/api/vehicles`.
6. Sign in as the administrator, create a vehicle using the dealership's verified details, add HTTPS image URLs, set the status to `AVAILABLE`, and publish it. Confirm that it appears publicly.
7. Test logout, invalid login, admin permissions, vehicle editing, unpublishing, archiving, and the public contact links.

## Local development on Windows

From PowerShell:

```powershell
cd C:\legendmotorswebsite
npm ci
npx prisma validate
npx prisma generate
npm run lint
npx tsc --noEmit
npm test
npm run dev
```

Open `http://localhost:3000`. Keep `.env` private. Never send its contents or commit it to Git.

## Release checklist

- [ ] CI checks pass: lint, TypeScript, tests, and production build.
- [ ] Production database is backed up and schema is applied intentionally.
- [ ] Admin credentials are unique and stored securely.
- [ ] Real stock data and photos have been verified by the dealership.
- [ ] Vehicle create/edit/publish/unpublish/archive workflows are tested.
- [ ] Public inventory, individual vehicle details, and WhatsApp/contact links are tested on the deployed domain.
- [ ] No secrets or test/demo stock are exposed publicly.
- [ ] Client owns or has access to hosting, domain, database, and recovery credentials.

## Current known limitation

Inventory image management stores externally hosted image URLs and image metadata. It is not a file-upload service. To support direct uploads, configure a persistent object-storage provider and implement authenticated upload handling before promising that feature to the client.
