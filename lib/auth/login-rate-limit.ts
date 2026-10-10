import { createHash, randomUUID } from "node:crypto";

import { prisma } from "@/lib/db/prisma";

const ACCOUNT_WINDOW_SECONDS = 30 * 60;
const ACCOUNT_MAX_ATTEMPTS = 8;
const ADDRESS_WINDOW_SECONDS = 15 * 60;
const ADDRESS_MAX_ATTEMPTS = 30;

type BucketResult = {
  attempts: number;
  blockedUntil: Date | null;
};

function hashBucketKey(kind: "account" | "address", value: string) {
  return createHash("sha256").update(`${kind}:${value}`).digest("hex");
}

async function consumeBucket(
  bucketKey: string,
  maximumAttempts: number,
  windowSeconds: number,
  now: Date,
): Promise<BucketResult> {
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);

  const rows = await prisma.$queryRaw<BucketResult[]>`
    INSERT INTO "LoginRateLimitBucket" (
      "id", "bucketKey", "attempts", "windowStartedAt", "blockedUntil", "updatedAt"
    ) VALUES (
      ${randomUUID()}, ${bucketKey}, 1, ${now}, NULL, ${now}
    )
    ON CONFLICT ("bucketKey") DO UPDATE SET
      "attempts" = CASE
        WHEN "LoginRateLimitBucket"."blockedUntil" > ${now} THEN "LoginRateLimitBucket"."attempts"
        WHEN "LoginRateLimitBucket"."windowStartedAt" <= ${windowStart} THEN 1
        ELSE "LoginRateLimitBucket"."attempts" + 1
      END,
      "windowStartedAt" = CASE
        WHEN "LoginRateLimitBucket"."blockedUntil" > ${now} THEN "LoginRateLimitBucket"."windowStartedAt"
        WHEN "LoginRateLimitBucket"."windowStartedAt" <= ${windowStart} THEN ${now}
        ELSE "LoginRateLimitBucket"."windowStartedAt"
      END,
      "blockedUntil" = CASE
        WHEN "LoginRateLimitBucket"."blockedUntil" > ${now} THEN "LoginRateLimitBucket"."blockedUntil"
        WHEN "LoginRateLimitBucket"."windowStartedAt" <= ${windowStart} THEN NULL
        WHEN "LoginRateLimitBucket"."attempts" >= ${maximumAttempts}
          THEN "LoginRateLimitBucket"."windowStartedAt" + (${windowSeconds} * INTERVAL '1 second')
        ELSE NULL
      END,
      "updatedAt" = ${now}
    RETURNING "attempts", "blockedUntil"
  `;

  return rows[0];
}

export async function consumeLoginAttempt(email: string, address?: string | null, now = new Date()) {
  await prisma.loginRateLimitBucket.deleteMany({
    where: { updatedAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
  });
  const accountKey = hashBucketKey("account", email.trim().toLowerCase());
  const account = await consumeBucket(accountKey, ACCOUNT_MAX_ATTEMPTS, ACCOUNT_WINDOW_SECONDS, now);
  const addressKey = address?.trim() ? hashBucketKey("address", address.trim()) : null;
  const network = addressKey
    ? await consumeBucket(addressKey, ADDRESS_MAX_ATTEMPTS, ADDRESS_WINDOW_SECONDS, now)
    : null;
  const blocks = [account.blockedUntil, network?.blockedUntil].filter((value): value is Date => value != null);
  const blockedUntil = blocks.length ? new Date(Math.max(...blocks.map((value) => value.getTime()))) : null;

  return {
    allowed: blockedUntil === null || blockedUntil <= now,
    retryAfterSeconds: blockedUntil ? Math.max(1, Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000)) : 0,
  };
}

export async function clearLoginAttempts(email: string, address?: string | null) {
  const bucketKeys = [hashBucketKey("account", email.trim().toLowerCase())];
  if (address?.trim()) bucketKeys.push(hashBucketKey("address", address.trim()));
  await prisma.loginRateLimitBucket.deleteMany({ where: { bucketKey: { in: bucketKeys } } });
}
