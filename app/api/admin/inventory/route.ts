import { NextResponse } from "next/server";

import { hasPermission } from "@/lib/auth/authorization";
import { getCurrentUser } from "@/lib/auth/session";
import { createInventoryVehicle, inventoryError, listInventoryVehicles } from "@/lib/inventory";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!hasPermission(user, "inventory:view")) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    return NextResponse.json({ vehicles: await listInventoryVehicles() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to load inventory." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!hasPermission(user, "inventory:manage")) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const payload: unknown = await request.json();
    const vehicle = await createInventoryVehicle(payload, user.id);

    return NextResponse.json({ vehicle }, { status: 201 });
  } catch (error) {
    const result = inventoryError(error);
    return NextResponse.json({ error: result.message, ...("issues" in result ? { issues: result.issues } : {}) }, { status: result.status });
  }
}
