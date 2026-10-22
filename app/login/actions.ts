"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { prisma } from "@/lib/db/prisma";
import { verifyUserCredentials } from "@/lib/auth/credentials";
import { clearLoginAttempts, consumeLoginAttempt } from "@/lib/auth/login-rate-limit";
import { createSessionForUser, revokeSessionToken, setSessionCookie } from "@/lib/auth/session";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=Please provide a valid email and password.");
  }

  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",").map((part) => part.trim()).filter(Boolean);
  const address = requestHeaders.get("x-vercel-forwarded-for")?.trim()
    || requestHeaders.get("x-real-ip")?.trim()
    || forwardedFor?.at(-1)
    || null;
  let attempt: Awaited<ReturnType<typeof consumeLoginAttempt>>;
  try {
    attempt = await consumeLoginAttempt(email, address);
  } catch {
    redirect("/login?error=Login+service+temporarily+unavailable.+Please+try+again+shortly.");
  }

  if (!attempt.allowed) {
    redirect("/login?error=Too+many+sign-in+attempts.+Try+again+later.");
  }

  let user: Awaited<ReturnType<typeof verifyUserCredentials>>;
  try {
    user = await verifyUserCredentials(email, password);
  } catch {
    redirect("/login?error=Login+service+temporarily+unavailable.+Please+try+again+shortly.");
  }

  if (!user) {
    redirect("/login?error=Invalid email or password.");
  }

  try {
    // Clearing counters is housekeeping. A cleanup failure must not block a
    // correctly authenticated user from receiving a session.
    await clearLoginAttempts(email, address).catch(() => undefined);
    const { token } = await createSessionForUser(user.id);
    await setSessionCookie(token);
  } catch {
    redirect("/login?error=Could+not+start+your+session.+Please+try+again+shortly.");
  }

  // Updating the last-login timestamp is non-critical and must not break a valid sign-in.
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  }).catch(() => undefined);

  redirect("/admin");
}

export async function logout() {
  const cookieStore = await import("next/headers").then((module) => module.cookies());
  const token = cookieStore.get("legend_motors_session")?.value;

  if (token) {
    await revokeSessionToken(token);
  }

  cookieStore.delete("legend_motors_session");
  redirect("/login");
}
