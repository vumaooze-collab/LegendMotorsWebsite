"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { hasPermission } from "@/lib/auth/authorization";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const saleSchema = z.object({
  vehicleId: z.string().trim().min(1),
  customerId: z.string().trim().optional().default(""),
  depositAmount: z.coerce.number().finite().nonnegative().optional().default(0),
});

export async function createSale(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "sales:manage")) redirect("/login?error=Access%20denied.");

  const parsed = saleSchema.safeParse({
    vehicleId: formData.get("vehicleId"),
    customerId: formData.get("customerId") ?? "",
    depositAmount: formData.get("depositAmount") ?? 0,
  });
  if (!parsed.success) redirect("/admin/sales?error=Enter%20valid%20sale%20details.");

  try {
    const saleId = await prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findUnique({ where: { id: parsed.data.vehicleId } });
      if (!vehicle || vehicle.status !== "AVAILABLE" || !vehicle.published) throw new Error("VEHICLE_UNAVAILABLE");

      const amount = Number(vehicle.price);
      if (parsed.data.depositAmount > amount) throw new Error("DEPOSIT_EXCEEDS_TOTAL");

      if (parsed.data.customerId) {
        const customer = await tx.customer.findUnique({ where: { id: parsed.data.customerId }, select: { id: true } });
        if (!customer) throw new Error("CUSTOMER_NOT_FOUND");
      }

      const claimed = await tx.vehicle.updateMany({
        where: { id: vehicle.id, status: "AVAILABLE", published: true },
        data: { status: "SOLD", published: false },
      });
      if (claimed.count !== 1) throw new Error("VEHICLE_UNAVAILABLE");

      const sale = await tx.sale.create({
        data: {
          saleNumber: `LM-${Date.now()}-${randomBytes(3).toString("hex").toUpperCase()}`,
          customerId: parsed.data.customerId || null,
          status: "PENDING",
          totalAmount: vehicle.price,
          depositAmount: parsed.data.depositAmount,
          balanceAmount: amount - parsed.data.depositAmount,
          saleItems: { create: { vehicleId: vehicle.id, unitPrice: vehicle.price, quantity: 1 } },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "SALE_RECORDED",
          entity: "Sale",
          entityId: sale.id,
          details: JSON.stringify({ saleNumber: sale.saleNumber, vehicleId: vehicle.id, totalAmount: amount }),
        },
      });
      return sale.id;
    });

    revalidatePath("/admin/sales");
    revalidatePath("/admin");
    revalidatePath("/admin/inventory");
    revalidatePath("/vehicles");
    redirect(`/admin/sales?created=${encodeURIComponent(saleId)}`);
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    if (error instanceof Error && error.message === "VEHICLE_UNAVAILABLE") redirect("/admin/sales?error=That%20vehicle%20is%20no%20longer%20available.");
    if (error instanceof Error && error.message === "DEPOSIT_EXCEEDS_TOTAL") redirect("/admin/sales?error=Deposit%20cannot%20exceed%20the%20vehicle%20price.");
    if (error instanceof Error && error.message === "CUSTOMER_NOT_FOUND") redirect("/admin/sales?error=Choose%20a%20valid%20customer.");
    throw error;
  }
}
