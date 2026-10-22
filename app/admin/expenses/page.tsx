import Link from "next/link";
import { createExpense } from "./actions";
import { hasPermission } from "@/lib/auth/authorization";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

type ExpensesPageProps = { searchParams?: Promise<{ created?: string; error?: string }> };

function formatMoney(amount: number | string) {
  return `MWK ${new Intl.NumberFormat("en-MW", { maximumFractionDigits: 0 }).format(Number(amount))}`;
}

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const user = await getCurrentUser();
  const canManage = hasPermission(user, "expenses:manage");
  const params = searchParams ? await searchParams : {};
  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({ orderBy: [{ incurredOn: "desc" }, { createdAt: "desc" }], take: 200 }),
    prisma.expense.aggregate({ _sum: { amount: true }, _count: { _all: true } }),
  ]);
  const totalAmount = Number(total._sum.amount ?? 0);

  return <main className="admin-main"><div style={{ maxWidth: 1280, margin: "0 auto" }}>
    <header style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "end", gap: 16, marginBottom: 24 }}>
      <div><p style={{ margin: 0, color: "#7a4a2c", fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" }}>Dealership operations</p><h1 style={{ margin: "8px 0 0", fontSize: 38 }}>Expenses</h1><p style={{ color: "#68716d", marginBottom: 0 }}>Record operating costs and keep a clear expense history.</p></div>
      <Link href="/admin" style={{ color: "#202321", fontWeight: 700 }}>← Dashboard</Link>
    </header>
    {params.created ? <p role="status" style={{ padding: 14, background: "#edf7ef", border: "1px solid #b9dfc0", borderRadius: 8 }}>Expense recorded successfully.</p> : null}
    {params.error ? <p role="alert" style={{ padding: 14, background: "#fff0ed", border: "1px solid #f0c2b8", borderRadius: 8 }}>{params.error}</p> : null}
    <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
      <article style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 20 }}><p style={{ color: "#68716d", margin: 0, fontSize: 13 }}>All-time recorded expenses</p><h2 style={{ margin: "8px 0 0", fontSize: 28 }}>{formatMoney(totalAmount)}</h2></article>
      <article style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 20 }}><p style={{ color: "#68716d", margin: 0, fontSize: 13 }}>Expense records</p><h2 style={{ margin: "8px 0 0", fontSize: 28 }}>{total._count._all}</h2></article>
    </section>
    {canManage ? <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 22, marginBottom: 24 }}>
      <h2 style={{ margin: "0 0 16px", fontSize: 22 }}>Record an expense</h2>
      <form action={createExpense} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        <label style={labelStyle}>Expense title<input name="title" required minLength={2} maxLength={160} style={fieldStyle}/></label>
        <label style={labelStyle}>Amount (MWK)<input name="amount" type="number" min="0.01" step="0.01" required style={fieldStyle}/></label>
        <label style={labelStyle}>Date incurred<input name="incurredOn" type="date" style={fieldStyle}/></label>
        <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>Description / notes<textarea name="description" rows={3} maxLength={2000} style={{ ...fieldStyle, resize: "vertical" }}/></label>
        <div><button className="button button--charcoal" type="submit">Save expense →</button></div>
      </form>
    </section> : null}
    <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: 20, borderBottom: "1px solid #eef0f1" }}><h2 style={{ margin: 0, fontSize: 22 }}>Recent expenses</h2><p style={{ margin: "4px 0 0", color: "#68716d", fontSize: 13 }}>Showing latest {expenses.length} records (maximum 200).</p></div>
      {expenses.length ? <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}><thead><tr style={{ textAlign: "left", color: "#68716d", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>{["Expense", "Date", "Amount", "Notes", "Recorded"].map((label) => <th key={label} style={{ padding: "13px 16px" }}>{label}</th>)}</tr></thead><tbody>{expenses.map((expense) => <tr key={expense.id} style={{ borderTop: "1px solid #eef0f1" }}><td style={{ padding: "14px 16px", fontWeight: 750 }}>{expense.title}</td><td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>{expense.incurredOn.toLocaleDateString("en-GB")}</td><td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>{formatMoney(Number(expense.amount))}</td><td style={{ padding: "14px 16px", fontSize: 13 }}>{expense.description || "—"}</td><td style={{ padding: "14px 16px", whiteSpace: "nowrap", fontSize: 12 }}>{expense.createdAt.toLocaleDateString("en-GB")}</td></tr>)}</tbody></table></div> : <div style={{ padding: 34, textAlign: "center" }}><h3 style={{ marginTop: 0 }}>No expenses recorded</h3><p style={{ color: "#68716d" }}>Record operating costs above to start building your expense history.</p></div>}
    </section>
  </div></main>;
}

const labelStyle = { display: "grid", gap: 6, fontSize: 13, fontWeight: 700 } as const;
const fieldStyle = { width: "100%", minHeight: 44, padding: "10px 12px", border: "1px solid #cfd5d1", borderRadius: 6, background: "#fff", color: "#202321", fontWeight: 400 } as const;
