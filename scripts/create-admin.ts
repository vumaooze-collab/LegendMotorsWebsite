import bcrypt from "bcryptjs";

import { prisma } from "../lib/db/prisma";

async function main() {
  const email = process.env.INITIAL_ADMIN_EMAIL || "admin@legendmotors.local";
  const password = process.env.INITIAL_ADMIN_PASSWORD;

  if (!password || password.length < 8) {
    throw new Error("INITIAL_ADMIN_PASSWORD must be set and at least 8 characters long.");
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

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: "Legend Motors Admin",
      passwordHash,
      roleId: role.id,
      isActive: true,
    },
    create: {
      name: "Legend Motors Admin",
      email,
      passwordHash,
      roleId: role.id,
      isActive: true,
    },
  });

  console.log(`Admin user ready: ${user.email}`);
}

main().catch((error: unknown) => {
  console.error("Failed to create the initial administrator.");
  console.error(error instanceof Error ? error.message : "Unknown error");
  process.exit(1);
});
