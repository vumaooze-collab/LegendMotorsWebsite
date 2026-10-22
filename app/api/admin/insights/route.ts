import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/authorization";
import { getDealershipInsights } from "@/lib/analytics/dealership-insights";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!hasPermission(user, "reports:view")) {
    return NextResponse.json({ error: "You do not have permission to view dealership insights." }, { status: user ? 403 : 401 });
  }

  try {
    const insights = await getDealershipInsights();
    return NextResponse.json(insights, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Dealership insights are temporarily unavailable. Check the database connection." }, { status: 503 });
  }
}
