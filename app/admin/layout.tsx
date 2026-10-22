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
  const navItems = [
    ...(hasPermission(user, "dashboard:view") ? [{ label: "Dashboard", href: "/admin" }] : []),
    ...(hasPermission(user, "inventory:view") ? [{ label: "Inventory", href: "/admin/inventory" }] : []),
    ...(hasPermission(user, "customers:view") ? [{ label: "Customers", href: "/admin/customers" }] : []),
    ...(hasPermission(user, "sales:view") ? [{ label: "Sales", href: "/admin/sales" }] : []),
    ...(hasPermission(user, "expenses:manage") ? [{ label: "Expenses", href: "/admin/expenses" }] : []),
    ...(hasPermission(user, "reports:view") ? [{ label: "Reports", href: "/admin/reports" }] : []),
    ...(hasPermission(user, "users:manage") ? [{ label: "Users", href: "/admin/users" }] : []),
  ];

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-header-inner">
          <div>
            <p className="admin-brand">Legend Motors</p>
            <h2 className="admin-title">Admin console</h2>
          </div>
          <nav className="admin-nav" aria-label="Admin navigation">
            {navItems.map(({ label, href }) => <Link key={label} href={href}>{label}</Link>)}
            <div className="admin-user">
              <span style={{ fontWeight: 700 }}>Hi, {user.name}</span>
              <span style={{ color: "#68716d" }}>({role})</span>
              <form action={logout}><button type="submit">Logout</button></form>
            </div>
          </nav>
        </div>
      </header>
      <div>{children}</div>
    </div>
  );
}
