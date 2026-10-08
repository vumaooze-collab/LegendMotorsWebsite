"use server";

import { createHash } from "crypto";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { createSessionForUser, setSessionCookie } from "@/lib/auth/session";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=Please provide a valid email and password.");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!user || !user.passwordHash || !user.isActive) {
    redirect("/login?error=Invalid email or password.");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    redirect("/login?error=Invalid email or password.");
  }

  const { token } = await createSessionForUser(user.id);
  await setSessionCookie(token);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
    },
  });

  redirect("/admin");
}

export async function logout() {
  const cookieStore = await import("next/headers").then((module) => module.cookies());
  const token = cookieStore.get("legend_motors_session")?.value;

  if (token) {
    await prisma.session.deleteMany({
      where: {
        tokenHash: createHash("sha256").update(token).digest("hex"),
      },
    });
  }

  cookieStore.delete("legend_motors_session");
  redirect("/login");
}
