import bcrypt from "bcryptjs";
import { z } from "zod";

import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { prisma } = await import("../lib/db/prisma");
  const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  const resetExisting = process.argv.includes("--reset-existing");

  if (!email || !z.email().safeParse(email).success) {
    throw new Error("Set INITIAL_ADMIN_EMAIL to the intended administrator email address.");
  }
  if (!password || password.length < 12) {
    throw new Error("INITIAL_ADMIN_PASSWORD must be set and at least 12 characters long.");
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser && !resetExisting) {
    throw new Error("That account already exists. Use --reset-existing only when an administrator password reset is intended.");
  }

  const role = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: {
      name: "ADMIN",
      description: "Full dealership system access",
    },
  });

  const passwordHash = await bcrypt.hash(password, 12);

  if (existingUser) {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existingUser.id },
        data: { passwordHash, roleId: role.id, isActive: true },
      });
      await tx.session.updateMany({
        where: { userId: existingUser.id },
        data: { isActive: false },
      });
    });
  } else {
    await prisma.user.create({
      data: {
        name: "Legend Motors Admin",
        email,
        passwordHash,
        roleId: role.id,
        isActive: true,
      },
    });
  }

  console.log("Administrator account initialized.");
}

main().catch((error: unknown) => {
  console.error("Failed to create the initial administrator.");
  console.error(error instanceof Error ? error.message : "Unknown error");
  process.exit(1);
});
