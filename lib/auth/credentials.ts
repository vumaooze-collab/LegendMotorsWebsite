import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db/prisma";

export async function verifyUserCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) return null;

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail }, include: { role: true } });
  if (!user?.isActive || !user.passwordHash) return null;
  return await bcrypt.compare(password, user.passwordHash) ? user : null;
}
