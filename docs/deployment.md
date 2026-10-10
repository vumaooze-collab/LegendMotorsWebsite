# Legend Motors deployment and handoff

## Application architecture

Legend Motors is a full-stack Next.js application. The public pages and admin dashboard use server-side API routes, Prisma, and PostgreSQL. It **cannot be deployed as a fully working application to GitHub Pages**, which only serves static files.

Recommended hosting:
- **Web application:** Vercel (or another host that supports the Next.js Node.js runtime).
- **Database:** managed PostgreSQL reachable from the web host.
- **Vehicle photos:** use HTTPS image URLs from a reliable image host for now. The admin UI currently stores image URLs and metadata; it does not upload binary image files to storage.

## Required environment variables

Configure only the runtime database URL in the hosting provider's project settings. Do not commit any real values.

- `DATABASE_URL`: production PostgreSQL connection string (use the Neon pooled endpoint for Vercel runtime).
- `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD`: set temporarily in a trusted terminal only when bootstrapping an administrator against the intended database. The bootstrap requires at least 12 password characters. Do not store these in Vercel project settings; unset them after the one-time command.
- `TEST_DATABASE_URL`: disposable PostgreSQL database used by the API integration test in local or CI runs. Do not configure this as production data access.

The bootstrap script requires an explicit `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD`. It creates a new admin and refuses to change an existing account by default. To intentionally reset an existing account, run `npm run auth:bootstrap -- --reset-existing` after confirming the target email and database; a reset disables all of that account's existing sessions. Never place real values in Git or deployment logs.

`.env.example` contains local-only placeholder values and is safe to copy to `.env` for development. Replace them with private values. `.env` and deployment environment files remain ignored by Git.

## Database safety

The integration test runs only when `TEST_DATABASE_URL` is explicitly set. It creates temporary users, sessions, vehicles, images, and audit rows, then removes those test records. Point it at a disposable local or CI database. A plain `DATABASE_URL` is not sufficient to enable the integration test.

For an existing database, inspect its tables and data before applying Prisma changes. Generate and review a schema diff on an isolated database or Neon branch first. Do not run `prisma db push` against a non-empty database just because the application tables are absent.

For Neon, use the pooled connection for normal serverless application requests. Use the direct (non-`-pooler`) connection when running schema commands such as `prisma migrate deploy`. This Prisma schema currently uses `DATABASE_URL` for both Prisma Client and schema commands, so set it to the appropriate direct URL in a trusted migration terminal and to the pooled URL in the deployed runtime.

### Current production database inspection (2026-10-10)

The existing Neon `neondb` contains Neon Auth tables and the `public.playing_with_neon` sample table with 20 rows. It was left unchanged. A separate empty `legend_motors_app` database was provisioned for this application. The local `.env` points to a localhost development database and is not the production Neon connection.

## First-time production setup

1. Create a **new, empty** managed PostgreSQL database and keep its connection string private.
2. Create a least-privilege runtime database role, connect the project to the host, and configure the runtime `DATABASE_URL` with that role. Do not use the Neon project owner credential as the application's runtime credential.
3. From a trusted terminal with the production `DATABASE_URL` set, review the checked-in migration and confirm the target database is the empty application database before applying it:
   ```powershell
   npx prisma validate
   npx prisma generate
   npx prisma migrate deploy
   ```
   Do not run migrations against a database containing valuable data without first taking a backup and reviewing the proposed changes. Use a direct Neon connection for migrations and a pooled connection for serverless runtime when both are available.
4. In the trusted terminal, set `INITIAL_ADMIN_EMAIL` and enter a strong, unique password through a masked prompt. Run the bootstrap command against the intended production database, then remove those temporary environment values:
   ```powershell
   $env:INITIAL_ADMIN_EMAIL = Read-Host "Administrator email"
   $adminPassword = Read-Host "Administrator password" -AsSecureString
   $env:INITIAL_ADMIN_PASSWORD = [System.Net.NetworkCredential]::new("", $adminPassword).Password
   npm run auth:bootstrap
   Remove-Item Env:INITIAL_ADMIN_EMAIL
   Remove-Item Env:INITIAL_ADMIN_PASSWORD
   Remove-Variable adminPassword
   ```
5. Deploy the application and verify `/login`, `/admin`, `/vehicles`, and `/api/vehicles`.
6. Sign in as the administrator, create a vehicle using the dealership's verified details, add HTTPS image URLs, set the status to `AVAILABLE`, and publish it. Confirm that it appears publicly.
7. Test logout, invalid login, admin permissions, vehicle editing, unpublishing, archiving, and the public contact links.

## Local development on Windows

From PowerShell:

```powershell
cd C:\legendmotorswebsite
npm ci
node --version  # CI currently uses Node.js 22
npx prisma validate
npx prisma generate
npm run lint
npx tsc --noEmit
npm test
npm run dev
```

To run the PostgreSQL integration test locally, set `TEST_DATABASE_URL` for the current PowerShell session to a disposable test database before running `npm test`. Without it, the database integration test is skipped while unit tests still run.

Open `http://localhost:3000`. Keep `.env` private. Never send its contents or commit it to Git.

## Troubleshooting

- **Prisma P1012 or datasource URL errors:** confirm `.env` is in the project root, `DATABASE_URL` starts with `postgresql://` (or `postgres://`), and reserved characters in credentials are URL-encoded. Then run `npx prisma validate` and `npx prisma generate`. The checked-in schema uses Prisma 6's supported `url = env("DATABASE_URL")` datasource configuration.
- **Prisma cannot apply a schema through Neon:** check that the command uses a direct connection URL without `-pooler`; keep the pooled URL for serverless application runtime.
- **The database integration test is skipped:** set `TEST_DATABASE_URL` for the current shell to a disposable database that already has the Prisma schema applied. The test intentionally ignores `DATABASE_URL` on its own.
- **Login does not work:** confirm the administrator was bootstrapped on the same database used by the app, and that the account is active. The bootstrap script will not change an existing account unless `--reset-existing` is explicitly passed.
- **A vehicle image is missing:** use an absolute HTTPS image URL that is publicly reachable. The current inventory system stores image URLs and metadata; it does not upload image files.

## Release checklist

- [ ] CI checks pass: lint, TypeScript, tests, and production build.
- [ ] PostgreSQL integration tests use a dedicated disposable database (`TEST_DATABASE_URL`).
- [ ] Production database is backed up and schema is applied intentionally.
- [ ] Admin credentials are unique and stored securely.
- [ ] Real stock data and photos have been verified by the dealership.
- [ ] Vehicle create/edit/publish/unpublish/archive workflows are tested.
- [ ] Public inventory, individual vehicle details, and WhatsApp/contact links are tested on the deployed domain.
- [ ] No secrets or test/demo stock are exposed publicly.
- [ ] Client owns or has access to hosting, domain, database, and recovery credentials.

## Current known limitation

Inventory image management stores externally hosted image URLs and image metadata. It is not a file-upload service. To support direct uploads, configure a persistent object-storage provider and implement authenticated upload handling before promising that feature to the client.

## Client vehicle photo workflow

The client supplies the actual photographs for each vehicle. The editorial photographs in `public/images` are only for visual presentation and are labeled as illustrative; they must never be treated as dealership inventory photographs.

The current admin workflow stores image URLs and metadata, not files. Before adding stock, the client or dealership should place each approved vehicle photograph in a reliable image host that provides a public, stable HTTPS URL. The URL must open the image itself without a login, temporary sharing token, or expiring access grant. JPEG, PNG, or WebP are suitable formats. Send the URL and a short, accurate description of the view to an authorized inventory manager through the dealership's private process.

To add the photographs:

1. Sign in at `/login` and open **Inventory**.
2. Create the vehicle with verified information. Vehicle creation does not require photographs; an image-free vehicle can be saved as a draft.
3. Choose **Images** for that vehicle, enter the public HTTPS image URL and descriptive alt text, then select **Add image URL**. The first image becomes primary automatically.
4. Add further angles the same way. Use **Set primary** to choose the catalog/detail lead image; **Up** and **Down** change display order; **Remove** deletes an image record.
5. Open the public vehicle page and confirm that each image loads and is framed correctly before publishing. A missing or unreachable image displays a neutral fallback. An invalid or non-HTTPS URL is rejected with the validation message.

The dealership owns the image-hosting account and must keep each URL available for as long as its listing is public. The website does not upload files from a computer. Direct computer uploads require a persistent storage service, credentials, and a separately implemented authenticated upload flow.

## Verified local test environment

The PostgreSQL integration test can be run against a dedicated local database. Create an empty database such as `legend_motors_test`, apply the Prisma schema to that database only, and set `TEST_DATABASE_URL` to its connection string for `npm test`. The test creates temporary admin, staff, vehicle, image, and audit records and cleans them up. Never use production or the normal development database for this test.

The production application database `legend_motors_app` was confirmed empty, then initialized with the checked-in `20261010130000_init` Prisma migration in a transaction. The migration record and schema were verified after application. It contains the Prisma models plus `_prisma_migrations`; no vehicle or user records have been seeded. Keep the original `neondb` and its Neon Auth/sample data separate from the dealership application.

## Production backup and recovery

Read-only inspection on 2026-10-10 found no scheduled Neon snapshots and no project snapshots. The client should choose an automatic snapshot frequency and retention after checking the Neon plan and any storage charges before entering customer or sales data. For recovery, restore a snapshot to a new branch, verify the restored application there, then change the application's database target only after the owner approves the cutover. Never restore over the current production branch as the first recovery step.

## Manual responsive and image review

Browser screenshot automation was unavailable during this handoff. Before launch, run `npm run dev` against a non-production database and review `/`, `/vehicles`, one published `/vehicles/[id]` page, `/login`, and `/admin/inventory` at approximately 375 px mobile, 768 px tablet, and 1440 px desktop widths. Check horizontal overflow, navigation by keyboard, empty and error states, images without URLs, a deliberately unreachable HTTPS image URL, and a multi-image gallery. Use only an authorized test account and test inventory; do not publish test records to production.

## Current launch blockers (verified 2026-10-10)

- No Vercel project is linked in this checkout (`.vercel` is absent), and the Vercel connector is not connected. Connect the connector or link the repository to the client-owned Vercel account, set runtime `DATABASE_URL`, deploy, then run the live checks in the release checklist.
- The separate empty production database `legend_motors_app` has been provisioned on the Neon production branch. The initial Prisma schema migration has been applied transactionally and verified: 23 public tables including `_prisma_migrations`, one completed init migration, zero vehicles, and zero users. The existing `neondb` and its Neon Auth/sample data remain unchanged. Before connecting the app, create a least-privilege runtime role and use its connection string rather than the database owner role.
- The intended production administrator email and password have not been supplied. The client must choose the email and enter a unique password in a trusted terminal at bootstrap time. Keep both bootstrap variables temporary and unset them afterward.
- Login attempts now use durable PostgreSQL buckets: 8 attempts per normalized account per 30 minutes and 30 attempts per client address per 15 minutes; stale hashed buckets are pruned after 24 hours. Successful login clears both buckets. The address limiter depends on the trusted hosting proxy overwriting `x-forwarded-for` (Vercel also supplies `x-vercel-forwarded-for`). Keep the hosting firewall/rate-limit rules enabled where available.
- The client has not yet supplied real stock information or vehicle image URLs. Keep the public catalog in its designed empty state until verified stock is entered; do not publish illustrative photography as inventory.
- The UI passed lint, type checking, Prisma checks, build, and the PostgreSQL integration suite locally. Browser viewport review and production URL checks remain outstanding.

The dashboard and inventory management are implemented. Customer, sales, expense, report, and user-management routes remain reserved placeholders and are not linked from the admin navigation; they are not part of the implemented inventory workflow.

Before handoff, ensure the client has owner or administrator access to the Vercel project, domain registrar, Neon project, and recovery credentials. Transfer administrator credentials through a private channel and agree who is responsible for backups and production database changes.
