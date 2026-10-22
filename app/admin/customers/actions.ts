"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { hasPermission } from "@/lib/auth/authorization";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const customerSchema = z.object({
  name: z.string().trim().min(2, "Enter the customer's name.").max(120),
  phone: z.string().trim().max(40).optional().default(""),
  email: z.string().trim().email("Enter a valid email address.").max(254).optional().or(z.literal("")),
  address: z.string().trim().max(240).optional().default(""),
  notes: z.string().trim().max(2000).optional().default(""),
});

export async function createCustomer(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "customers:manage")) {
    redirect("/login?error=Access%20denied.");
  }

  const parsed = customerSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
    address: formData.get("address") ?? "",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    redirect("/admin/customers?error=Check%20the%20customer%20details%20and%20try%20again.");
  }

  const customer = await prisma.$transaction(async (tx) => {
    const created = await tx.customer.create({
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        address: parsed.data.address || null,
        notes: parsed.data.notes || null,
      },
    });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "CUSTOMER_CREATED",
        entity: "Customer",
        entityId: created.id,
        details: JSON.stringify({ name: created.name }),
      },
    });
    return created;
  });

  revalidatePath("/admin/customers");
  redirect(`/admin/customers?created=${encodeURIComponent(customer.id)}`);
}
