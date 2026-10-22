# Legends Motors multi-language login prototype

This prototype is isolated from the existing Next.js app and lives on the `prototype/multilang-login` branch. It does not replace the production login or automatically deploy to Vercel.

## Services
- **PHP + minimal CSS:** login form and browser-facing handler.
- **Python / FastAPI:** validates credentials against the existing PostgreSQL `User` and `Role` tables and creates a row in `Session`.
- **C++:** a small, non-security-critical login-risk scoring helper. It never receives passwords and must not be treated as an authentication control.
- **PostgreSQL / Neon:** uses the existing schema through `DATABASE_URL`.

## Important integration boundary
To let the existing Next.js admin recognize the session cookie, the PHP login must be served on the same site origin (for example, behind a reverse proxy at `/legacy-login`) or use a shared parent domain configured for both apps. Separate unrelated hosts cannot share a host-only cookie. The prototype is not production-ready until hosting, HTTPS, rate limiting, CSRF protection, origin restrictions, secret management, and end-to-end tests are configured.

## Local run
1. Copy `.env.example` to `.env` and set `DATABASE_URL` to the Neon connection string for `legend_motors_app`. Never commit `.env`.
2. Run `docker compose up --build`.
3. Open `http://localhost:8080`.

No admin user is created by this prototype. Create the initial administrator through the existing secure admin-creation script.
