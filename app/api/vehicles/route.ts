import { NextResponse } from "next/server";

import { getInventoryRecords } from "@/lib/inventory";

export async function GET() {
  const vehicles = getInventoryRecords();

  return NextResponse.json({
    total: vehicles.length,
    vehicles,
  });
}
