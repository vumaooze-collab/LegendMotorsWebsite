import { createHash, randomBytes } from "crypto";

import { cookies } from "next/headers";

import { prisma } from "@/lib/db/prisma";

export const SESSION_COOKIE_NAME = "legend_motors_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export function createSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function revokeSessionToken(token: string) {
  return prisma.session.updateMany({
    where: { tokenHash: hashSessionToken(token) },
    data: { isActive: false },
  });
}

export async function createSessionForUser(userId: string) {
  const token = createSessionToken();
  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
      isActive: true,
    },
    include: {
      user: {
        include: {
          role: true,
        },
      },
    },
  });

  return { token, session };
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function deleteCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await revokeSessionToken(token);
  }

  await clearSessionCookie();
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findFirst({
    where: {
      tokenHash: hashSessionToken(token),
      isActive: true,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      user: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!session || !session.user.isActive) {
    if (session) {
      await prisma.session.updateMany({
        where: { id: session.id },
        data: { isActive: false },
      });
    }
    await clearSessionCookie();
    return null;
  }

  return session.user;
}

export async function requireAuthenticatedUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authentication required.");
  }

  return user;
}
