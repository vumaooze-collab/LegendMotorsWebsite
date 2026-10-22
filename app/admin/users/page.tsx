import Link from "next/link";
import { setUserActive } from "./actions";
import { hasPermission } from "@/lib/auth/authorization";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

type UsersPageProps = { searchParams?: Promise<{ updated?: string; error?: string }> };

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const currentUser = await getCurrentUser();
  if (!hasPermission(currentUser, "users:manage")) {
    return <main className="admin-main"><h1>Team accounts</h1><p>You do not have permission to manage team accounts.</p></main>;
  }
  const params = searchParams ? await searchParams : {};
  const users = await prisma.user.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    take: 200,
    include: { role: true, _count: { select: { sessions: true } } },
  });

  return <main className="admin-main"><div style={{ maxWidth: 1280, margin: "0 auto" }}>
    <header style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "end", gap: 16, marginBottom: 24 }}>
      <div><p style={{ margin: 0, color: "#7a4a2c", fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" }}>Access control</p><h1 style={{ margin: "8px 0 0", fontSize: 38 }}>Team accounts</h1><p style={{ color: "#68716d", marginBottom: 0 }}>Review registered users and revoke access when needed.</p></div>
      <Link href="/admin" style={{ color: "#202321", fontWeight: 700 }}>← Dashboard</Link>
    </header>
    {params.updated ? <p role="status" style={{ padding: 14, background: "#edf7ef", border: "1px solid #b9dfc0", borderRadius: 8 }}>Account access updated.</p> : null}
    {params.error ? <p role="alert" style={{ padding: 14, background: "#fff0ed", border: "1px solid #f0c2b8", borderRadius: 8 }}>{params.error}</p> : null}
    <p style={{ padding: 14, background: "#fff8e8", border: "1px solid #ead7a4", borderRadius: 8, color: "#6b5524", fontSize: 13 }}>This directory manages activation for existing accounts. New account creation and role assignment should be done through a separately secured onboarding process.</p>
    <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: 20, borderBottom: "1px solid #eef0f1" }}><h2 style={{ margin: 0, fontSize: 22 }}>Registered users</h2><p style={{ margin: "4px 0 0", color: "#68716d", fontSize: 13 }}>{users.length} account(s) shown, up to 200.</p></div>
      {users.length ? <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 780 }}><thead><tr style={{ textAlign: "left", color: "#68716d", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>{["User", "Role", "Status", "Last sign-in", "Created", "Access"].map((label) => <th key={label} style={{ padding: "13px 16px" }}>{label}</th>)}</tr></thead><tbody>{users.map((account) => <tr key={account.id} style={{ borderTop: "1px solid #eef0f1" }}>
        <td style={{ padding: "14px 16px" }}><strong>{account.name}</strong><div style={{ color: "#68716d", fontSize: 12 }}>{account.email}</div></td>
        <td style={{ padding: "14px 16px" }}>{account.role?.name ?? "No role"}</td>
        <td style={{ padding: "14px 16px" }}><span style={{ display: "inline-block", borderRadius: 999, padding: "4px 9px", background: account.isActive ? "#edf7ef" : "#fff0ed", color: account.isActive ? "#17643a" : "#9a2d20", fontSize: 12, fontWeight: 750 }}>{account.isActive ? "Active" : "Inactive"}</span></td>
        <td style={{ padding: "14px 16px", whiteSpace: "nowrap", fontSize: 12 }}>{account.lastLoginAt?.toLocaleString("en-GB") ?? "Never"}</td>
        <td style={{ padding: "14px 16px", whiteSpace: "nowrap", fontSize: 12 }}>{account.createdAt.toLocaleDateString("en-GB")}</td>
        <td style={{ padding: "14px 16px" }}>{account.id === currentUser?.id ? <span style={{ color: "#68716d", fontSize: 12 }}>Current account</span> : <form action={setUserActive}><input type="hidden" name="userId" value={account.id}/><input type="hidden" name="isActive" value={account.isActive ? "false" : "true"}/><button type="submit" style={{ border: "1px solid #cfd5d1", borderRadius: 6, padding: "7px 10px", background: "#fff", fontWeight: 700, cursor: "pointer" }}>{account.isActive ? "Deactivate" : "Reactivate"}</button></form>}</td>
      </tr>)}</tbody></table></div> : <div style={{ padding: 30, color: "#68716d" }}>No user accounts found.</div>}
    </section>
  </div></main>;
}
