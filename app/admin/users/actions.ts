"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { hasPermission } from "@/lib/auth/authorization";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const inputSchema = z.object({ userId: z.string().min(1), isActive: z.enum(["true", "false"]) });

export async function setUserActive(formData: FormData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !hasPermission(currentUser, "users:manage")) redirect("/login?error=Access%20denied.");

  const parsed = inputSchema.safeParse({ userId: formData.get("userId"), isActive: formData.get("isActive") });
  if (!parsed.success) redirect("/admin/users?error=Invalid%20user%20request.");
  if (parsed.data.userId === currentUser.id && parsed.data.isActive === "false") {
    redirect("/admin/users?error=You%20cannot%20deactivate%20your%20own%20account.");
  }

  const active = parsed.data.isActive === "true";
  await prisma.$transaction(async (tx) => {
    const target = await tx.user.findUniqueOrThrow({ where: { id: parsed.data.userId }, select: { id: true, isActive: true, email: true } });
    await tx.user.update({ where: { id: target.id }, data: { isActive: active } });
    if (!active) await tx.session.updateMany({ where: { userId: target.id }, data: { isActive: false } });
    await tx.auditLog.create({
      data: {
        userId: currentUser.id,
        action: active ? "USER_ACTIVATED" : "USER_DEACTIVATED",
        entity: "User",
        entityId: target.id,
        details: JSON.stringify({ email: target.email, from: target.isActive, to: active }),
      },
    });
  });

  revalidatePath("/admin/users");
  redirect("/admin/users?updated=1");
}
