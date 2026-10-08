import { NextResponse } from "next/server";

import { getPublicVehicle } from "@/lib/inventory";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const vehicle = await getPublicVehicle(id);
    if (!vehicle) return NextResponse.json({ error: "Vehicle not found." }, { status: 404 });
    return NextResponse.json({ vehicle }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Vehicle details are temporarily unavailable." }, { status: 500 });
  }
}