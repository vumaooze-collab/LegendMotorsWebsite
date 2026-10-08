import Link from "next/link";
import { redirect } from "next/navigation";

import { logout } from "@/app/login/actions";
import { hasPermission } from "@/lib/auth/authorization";
import { getCurrentUser } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user || !hasPermission(user, "dashboard:view")) {
    redirect("/login?error=Access denied.");
  }

  const role = user.role?.name ?? "STAFF";

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7f5" }}>
      <header style={{ borderBottom: "1px solid #e5e7eb", background: "#fff" }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <p style={{ margin: 0, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7a4a2c", fontWeight: 800, fontSize: 11 }}>
              Legend Motors
            </p>
            <h2 style={{ margin: "8px 0 0", fontSize: 24 }}>Admin console</h2>
          </div>

          <nav style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            {[
              ["Dashboard", "/admin"],
              ["Inventory", "/admin/inventory"],
              ["Customers", "/admin/customers"],
              ["Sales", "/admin/sales"],
              ["Expenses", "/admin/expenses"],
              ["Reports", "/admin/reports"],
              ["Users", "/admin/users"],
            ].map(([label, href]) => (
              <Link key={label} href={href} style={{ color: "#1f2937", fontWeight: 700, padding: "8px 12px", borderRadius: 999 }}>
                {label}
              </Link>
            ))}

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontWeight: 700 }}>Hi, {user.name}</span>
              <span style={{ color: "#68716d" }}>({role})</span>
              <form action={logout}>
                <button type="submit" style={{ background: "#111827", color: "#fff", border: 0, borderRadius: 999, padding: "10px 16px", fontWeight: 700, cursor: "pointer" }}>
                  Logout
                </button>
              </form>
            </div>
          </nav>
        </div>
      </header>

      <div>{children}</div>
    </div>
  );
}
