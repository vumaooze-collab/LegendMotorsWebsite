import { NextResponse } from "next/server";

import { hasPermission } from "@/lib/auth/authorization";
import { getCurrentUser } from "@/lib/auth/session";
import { addInventoryImage, getInventoryVehicle, inventoryError } from "@/lib/inventory";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!hasPermission(user, "inventory:view")) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  try {
    const { id } = await context.params;
    const vehicle = await getInventoryVehicle(id);
    if (!vehicle) return NextResponse.json({ error: "Vehicle not found." }, { status: 404 });
    return NextResponse.json({ images: vehicle.images });
  } catch {
    return NextResponse.json({ error: "Unable to load vehicle images." }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!hasPermission(user, "inventory:manage")) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  try {
    const { id } = await context.params;
    const payload: unknown = await request.json();
    const image = await addInventoryImage(id, payload, user.id);
    return NextResponse.json({ image }, { status: 201 });
  } catch (error) {
    const result = inventoryError(error);
    return NextResponse.json({ error: result.message, ...("issues" in result ? { issues: result.issues } : {}) }, { status: result.status });
  }
}