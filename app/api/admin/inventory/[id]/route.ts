import { NextResponse } from "next/server";

import { hasPermission } from "@/lib/auth/authorization";
import { getCurrentUser } from "@/lib/auth/session";
import { archiveInventoryVehicle, getInventoryVehicle, inventoryError, updateInventoryVehicle } from "@/lib/inventory";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();

  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!hasPermission(user, "inventory:view")) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const { id } = await context.params;
    const vehicle = await getInventoryVehicle(id);
    if (!vehicle) return NextResponse.json({ error: "Vehicle not found." }, { status: 404 });
    return NextResponse.json({ vehicle }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to load inventory record." }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();

  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!hasPermission(user, "inventory:manage")) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const { id } = await context.params;
    const payload: unknown = await request.json();
    const updatedVehicle = await updateInventoryVehicle(id, payload, user.id);

    return NextResponse.json({ vehicle: updatedVehicle });
  } catch (error) {
    const result = inventoryError(error);
    return NextResponse.json({ error: result.message, ...("issues" in result ? { issues: result.issues } : {}) }, { status: result.status });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return PUT(request, context);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!hasPermission(user, "inventory:manage")) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  try {
    const { id } = await context.params;
    const vehicle = await archiveInventoryVehicle(id, user.id);
    return NextResponse.json({ vehicle });
  } catch (error) {
    const result = inventoryError(error);
    return NextResponse.json({ error: result.message }, { status: result.status });
  }
}
