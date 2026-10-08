import { NextResponse } from "next/server";

import { hasPermission } from "@/lib/auth/authorization";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getCurrentUser();

  if (!user || !hasPermission(user, "dashboard:view")) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role?.name ?? "STAFF",
    },
  });
}
