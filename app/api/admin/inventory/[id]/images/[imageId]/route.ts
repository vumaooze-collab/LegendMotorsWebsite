import { NextResponse } from "next/server";

import { hasPermission } from "@/lib/auth/authorization";
import { getCurrentUser } from "@/lib/auth/session";
import { inventoryError, removeInventoryImage, updateInventoryImage } from "@/lib/inventory";

type RouteContext = { params: Promise<{ id: string; imageId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!hasPermission(user, "inventory:manage")) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  try {
    const { id, imageId } = await context.params;
    const payload: unknown = await request.json();
    const image = await updateInventoryImage(id, imageId, payload, user.id);
    return NextResponse.json({ image });
  } catch (error) {
    const result = inventoryError(error);
    return NextResponse.json({ error: result.message, ...("issues" in result ? { issues: result.issues } : {}) }, { status: result.status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!hasPermission(user, "inventory:manage")) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  try {
    const { id, imageId } = await context.params;
    await removeInventoryImage(id, imageId, user.id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    const result = inventoryError(error);
    return NextResponse.json({ error: result.message }, { status: result.status });
  }
}