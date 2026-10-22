"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { hasPermission } from "@/lib/auth/authorization";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const expenseSchema = z.object({
  title: z.string().trim().min(2).max(160),
  amount: z.coerce.number().finite().positive(),
  description: z.string().trim().max(2000).optional().default(""),
  incurredOn: z.string().trim().optional().default(""),
});

export async function createExpense(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "expenses:manage")) redirect("/login?error=Access%20denied.");

  const parsed = expenseSchema.safeParse({
    title: formData.get("title"),
    amount: formData.get("amount"),
    description: formData.get("description") ?? "",
    incurredOn: formData.get("incurredOn") ?? "",
  });
  if (!parsed.success) redirect("/admin/expenses?error=Enter%20a%20valid%20title%20and%20positive%20amount.");

  const incurredOn = parsed.data.incurredOn ? new Date(parsed.data.incurredOn) : new Date();
  if (Number.isNaN(incurredOn.getTime())) redirect("/admin/expenses?error=Enter%20a%20valid%20date.");

  await prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        title: parsed.data.title,
        amount: parsed.data.amount,
        description: parsed.data.description || null,
        incurredOn,
      },
    });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "EXPENSE_CREATED",
        entity: "Expense",
        entityId: expense.id,
        details: JSON.stringify({ title: expense.title, amount: Number(expense.amount) }),
      },
    });
  });

  revalidatePath("/admin/expenses");
  revalidatePath("/admin/reports");
  revalidatePath("/admin");
  redirect("/admin/expenses?created=1");
}
