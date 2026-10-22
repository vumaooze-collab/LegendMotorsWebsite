import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/authorization";
import { getMarketFeedUrl, saveMarketFeedUrl } from "@/lib/analytics/market-feed";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!hasPermission(user, "settings:manage")) {
    return NextResponse.json({ error: "Administrator permission required." }, { status: user ? 403 : 401 });
  }
  try {
    return NextResponse.json({ url: await getMarketFeedUrl() }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not read market source settings." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!hasPermission(user, "settings:manage")) {
    return NextResponse.json({ error: "Administrator permission required." }, { status: user ? 403 : 401 });
  }
  try {
    const body = await request.json();
    if (!body || typeof body.url !== "string" || body.url.length > 2048) {
      return NextResponse.json({ error: "Provide a feed URL under 2,048 characters." }, { status: 400 });
    }
    const url = await saveMarketFeedUrl(body.url);
    return NextResponse.json({ url, message: url ? "Market feed URL saved." : "Market feed disconnected." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save market source." }, { status: 400 });
  }
}
