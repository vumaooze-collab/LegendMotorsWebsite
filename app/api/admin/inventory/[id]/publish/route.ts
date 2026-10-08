import { NextResponse } from "next/server";

import { hasPermission } from "@/lib/auth/authorization";
import { getCurrentUser } from "@/lib/auth/session";
import { inventoryError, parsePublicationInput, setInventoryPublication } from "@/lib/inventory";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();

  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!hasPermission(user, "inventory:manage")) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const { id } = await context.params;
    const payload: unknown = await request.json();
    const published = parsePublicationInput(payload);
    const updatedVehicle = await setInventoryPublication(id, published, user.id);

    return NextResponse.json({ vehicle: updatedVehicle });
  } catch (error) {
    const result = inventoryError(error);
    return NextResponse.json({ error: result.message, ...("issues" in result ? { issues: result.issues } : {}) }, { status: result.status });
  }
}
