import { NextResponse } from "next/server";
import { z } from "zod";

import { listPublicVehicles } from "@/lib/inventory";

const publicFiltersSchema = z.object({
  q: z.string().trim().max(120).optional(),
  make: z.string().trim().max(60).optional(),
  year: z.coerce.number().int().min(1990).max(new Date().getFullYear() + 2).optional(),
  minPrice: z.coerce.number().finite().nonnegative().optional(),
  maxPrice: z.coerce.number().finite().nonnegative().optional(),
  maxMileage: z.coerce.number().int().nonnegative().optional(),
  fuelType: z.string().trim().max(40).optional(),
  transmission: z.string().trim().max(40).optional(),
}).refine((filters) => filters.minPrice === undefined || filters.maxPrice === undefined || filters.minPrice <= filters.maxPrice, "Minimum price must not exceed maximum price.");

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = publicFiltersSchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) return NextResponse.json({ error: "Invalid vehicle filters.", issues: parsed.error.issues }, { status: 400 });

  try {
    const vehicles = await listPublicVehicles({
      query: parsed.data.q,
      make: parsed.data.make,
      year: parsed.data.year,
      minPrice: parsed.data.minPrice,
      maxPrice: parsed.data.maxPrice,
      maxMileage: parsed.data.maxMileage,
      fuelType: parsed.data.fuelType,
      transmission: parsed.data.transmission,
    });
    return NextResponse.json({ total: vehicles.length, vehicles }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Vehicle listings are temporarily unavailable." }, { status: 500 });
  }
}
