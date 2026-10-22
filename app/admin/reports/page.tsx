import Link from "next/link";
import { hasPermission } from "@/lib/auth/authorization";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

function formatMoney(amount: number) {
  return `MWK ${new Intl.NumberFormat("en-MW", { maximumFractionDigits: 0 }).format(amount)}`;
}

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!hasPermission(user, "reports:view")) {
    return <main className="admin-main"><h1>Reports</h1><p>You do not have permission to view dealership reports.</p></main>;
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const [sales, expenses, inventory, customers, recentSales] = await Promise.all([
    prisma.sale.findMany({ where: { createdAt: { gte: yearStart } }, select: { totalAmount: true, depositAmount: true, balanceAmount: true, status: true, createdAt: true } }),
    prisma.expense.findMany({ where: { incurredOn: { gte: yearStart } }, select: { amount: true, incurredOn: true } }),
    prisma.vehicle.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.customer.count(),
    prisma.sale.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { customer: true, saleItems: { include: { vehicle: true } } } }),
  ]);

  const salesThisMonth = sales.filter((sale) => sale.createdAt >= monthStart);
  const expensesThisMonth = expenses.filter((expense) => expense.incurredOn >= monthStart);
  const totalSalesYtd = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
  const totalExpensesYtd = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const collectedYtd = sales.reduce((sum, sale) => sum + Number(sale.depositAmount ?? 0), 0);
  const outstandingYtd = sales.reduce((sum, sale) => sum + Number(sale.balanceAmount ?? 0), 0);
  const inventoryCounts = new Map(inventory.map((item) => [item.status, item._count._all]));
  const stats = [
    ["Sales this month", formatMoney(salesThisMonth.reduce((sum, sale) => sum + Number(sale.totalAmount), 0)), `${salesThisMonth.length} recorded sale(s)`],
    ["Expenses this month", formatMoney(expensesThisMonth.reduce((sum, expense) => sum + Number(expense.amount), 0)), `${expensesThisMonth.length} expense record(s)`],
    ["Sales year to date", formatMoney(totalSalesYtd), `${sales.length} sale record(s) since Jan 1`],
    ["Expenses year to date", formatMoney(totalExpensesYtd), `Recorded costs since Jan 1`],
    ["Deposits recorded YTD", formatMoney(collectedYtd), "Deposit entries, not a bank reconciliation"],
    ["Outstanding balances YTD", formatMoney(outstandingYtd), "Balances recorded against sales"],
  ];

  return <main className="admin-main"><div style={{ maxWidth: 1280, margin: "0 auto" }}>
    <header style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "end", gap: 16, marginBottom: 24 }}>
      <div><p style={{ margin: 0, color: "#7a4a2c", fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" }}>Management overview</p><h1 style={{ margin: "8px 0 0", fontSize: 38 }}>Reports</h1><p style={{ color: "#68716d", marginBottom: 0 }}>Live summaries from recorded sales, expenses and inventory.</p></div>
      <Link href="/admin" style={{ color: "#202321", fontWeight: 700 }}>← Dashboard</Link>
    </header>
    <p style={{ padding: 14, background: "#fff8e8", border: "1px solid #ead7a4", borderRadius: 8, color: "#6b5524", fontSize: 13 }}>These figures reflect records entered into this system. They are not audited financial statements and do not include unrecorded transactions.</p>
    <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
      {stats.map(([label, value, note]) => <article key={label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 20 }}><p style={{ color: "#68716d", margin: 0, fontSize: 13 }}>{label}</p><h2 style={{ margin: "8px 0", fontSize: 26 }}>{value}</h2><p style={{ color: "#68716d", margin: 0, fontSize: 12 }}>{note}</p></article>)}
    </section>
    <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
      {[["Available inventory", inventoryCounts.get("AVAILABLE") ?? 0], ["Reserved inventory", inventoryCounts.get("RESERVED") ?? 0], ["Sold vehicles", inventoryCounts.get("SOLD") ?? 0], ["Archived vehicles", inventoryCounts.get("ARCHIVED") ?? 0], ["Registered customers", customers]].map(([label, value]) => <article key={label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 20 }}><p style={{ color: "#68716d", margin: 0, fontSize: 13 }}>{label}</p><h2 style={{ margin: "8px 0 0", fontSize: 28 }}>{value}</h2></article>)}
    </section>
    <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: 20, borderBottom: "1px solid #eef0f1" }}><h2 style={{ margin: 0, fontSize: 22 }}>Latest sales activity</h2></div>
      {recentSales.length ? <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 650 }}><thead><tr style={{ textAlign: "left", color: "#68716d", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>{["Reference", "Vehicle", "Customer", "Total", "Date"].map((label) => <th key={label} style={{ padding: "13px 16px" }}>{label}</th>)}</tr></thead><tbody>{recentSales.map((sale) => <tr key={sale.id} style={{ borderTop: "1px solid #eef0f1" }}><td style={{ padding: "14px 16px", fontWeight: 700 }}>{sale.saleNumber}</td><td style={{ padding: "14px 16px" }}>{sale.saleItems.map((item) => `${item.vehicle.year} ${item.vehicle.make} ${item.vehicle.model}`).join(", ") || "—"}</td><td style={{ padding: "14px 16px" }}>{sale.customer?.name ?? "—"}</td><td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>{formatMoney(Number(sale.totalAmount))}</td><td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>{sale.createdAt.toLocaleDateString("en-GB")}</td></tr>)}</tbody></table></div> : <div style={{ padding: 30, color: "#68716d" }}>No sales have been recorded yet. Once entered, activity will appear here.</div>}
    </section>
  </div></main>;
}
