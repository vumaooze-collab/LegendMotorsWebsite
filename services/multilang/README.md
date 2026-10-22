# Legends Motors multi-language backend (v1)

This is an isolated service layer. It does not replace the existing Next.js login or change the Prisma schema.

## Services
- **PHP 8.3 / Apache**: internal dealership API for read-only inventory and readiness checks.
- **Python / FastAPI**: internal market-news analysis endpoint for headlines supplied by an administrator or a future verified feed adapter.
- **C++17**: small deterministic inventory-priority scoring helper; it is advisory only and is not used for authentication, prices, or financial decisions.
- **PostgreSQL / Neon**: same existing database, accessed with a least-privilege database role.

## Run
1. Copy `.env.example` to a private `.env` file in this directory.
2. Set `DATABASE_URL` to a PostgreSQL connection string for the dealership database. Keep it secret and never commit it.
3. Set a long random `INTERNAL_API_KEY` (at least 32 characters).
4. Run `docker compose up --build`.
5. PHP API: `http://localhost:8080/health`; Python API: `http://localhost:8000/health`.

## Routes
- PHP `GET /health`: service/database readiness.
- PHP `GET /api/vehicles`: public inventory fields for vehicles marked published and available.
- PHP `GET /api/internal/vehicles`: internal inventory metadata; requires `Authorization: Bearer <INTERNAL_API_KEY>`.
- Python `GET /health`: readiness.
- Python `POST /analyze/headlines`: analyze a bounded list of provided headlines; requires the internal API key.

The PHP service uses the PostgreSQL wire protocol through PDO and does not implement a second login system. Keep all internal routes private at the hosting/network layer as well as API-key protected. Do not expose the key to browser JavaScript.

## Production caveats
This is a deployable scaffold, not a production release. Run it behind HTTPS, configure private service networking, set a rotated secret in the host's secret manager, use a least-privilege database role, add monitoring and rate limits, and test against a staging database first. Do not point this at production until its host and network access are configured. The current Vercel Next.js application remains the production entry point. No deployment or database migration is performed by this branch.
