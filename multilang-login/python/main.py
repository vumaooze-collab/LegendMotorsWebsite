import hashlib
import os
import secrets
import subprocess
import uuid
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

import asyncpg
import bcrypt
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr

app = FastAPI(title="Legends Motors Login API", docs_url=None, redoc_url=None)
pool = None
DATABASE_URL = os.environ.get("DATABASE_URL", "")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@app.on_event("startup")
async def startup():
    global pool
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not configured")
    pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=5, command_timeout=5)


@app.on_event("shutdown")
async def shutdown():
    if pool:
        await pool.close()


@app.get("/health")
async def health():
    try:
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        return {"status": "ok", "database": "connected"}
    except Exception:
        raise HTTPException(status_code=503, detail="service unavailable")


@app.post("/login")
async def login(body: LoginRequest):
    email = str(body.email).strip().lower()
    if not body.password or len(body.password) > 1024:
        raise HTTPException(status_code=401, detail="invalid credentials")

    try:
        async with pool.acquire() as conn:
            user = await conn.fetchrow(
                '''
                SELECT u."id", u."passwordHash", u."isActive", r."name" AS "roleName"
                FROM "User" u
                LEFT JOIN "Role" r ON r."id" = u."roleId"
                WHERE lower(u."email") = $1
                LIMIT 1
                ''',
                email,
            )
            valid = False
            if user and user["isActive"] and user["passwordHash"]:
                try:
                    valid = bcrypt.checkpw(
                        body.password.encode("utf-8"),
                        user["passwordHash"].encode("utf-8"),
                    )
                except (ValueError, TypeError):
                    valid = False

            if not valid:
                raise HTTPException(status_code=401, detail="invalid credentials")

            # Use the same token-hash and cookie convention as the existing Next.js app.
            token = secrets.token_hex(32)
            token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
            await conn.execute(
                '''
                INSERT INTO "Session"
                  ("id", "userId", "tokenHash", "expiresAt", "isActive", "createdAt", "updatedAt")
                VALUES ($1, $2, $3, NOW() + INTERVAL '7 days', TRUE, NOW(), NOW())
                ''',
                str(uuid.uuid4()), user["id"], token_hash,
            )
            await conn.execute(
                'UPDATE "User" SET "lastLoginAt" = NOW(), "updatedAt" = NOW() WHERE "id" = $1',
                user["id"],
            )

        # C++ only returns a coarse score; it does not authenticate users or see passwords.
        # A failure in this optional helper must never allow/deny a login.
        try:
            subprocess.run(
                ["/usr/local/bin/login-risk", "1"],
                check=False, capture_output=True, text=True, timeout=1,
            )
        except Exception:
            pass

        return {"token": token, "role": user["roleName"] or "STAFF"}
    except HTTPException:
        raise
    except Exception:
        # Do not expose database details to callers.
        raise HTTPException(status_code=503, detail="login service temporarily unavailable")
