import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/authorization";
import { getDealershipInsights } from "@/lib/analytics/dealership-insights";

export const dynamic = "force-dynamic";

const panel = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 20 };
const muted = { color: "#68716d", fontSize: 13 };

function money(amount: number) {
  return `MWK ${new Intl.NumberFormat("en-MW", { maximumFractionDigits: 0 }).format(amount)}`;
}

export default async function InsightsPage() {
  const user = await getCurrentUser();
  if (!hasPermission(user, "reports:view")) {
    return <main className="admin-main"><h1>Dealership intelligence</h1><p>You do not have permission to view dealership insights.</p></main>;
  }

  let insights;
  try {
    insights = await getDealershipInsights();
  } catch {
    return <main className="admin-main"><div style={{ maxWidth: 1100, margin: "0 auto" }}><h1>Dealership intelligence</h1><p role="alert">The database could not return insights. Confirm the production DATABASE_URL and that the Prisma schema has been applied.</p><Link href="/admin">← Dashboard</Link></div></main>;
  }

  return <main className="admin-main"><div style={{ maxWidth: 1280, margin: "0 auto" }}>
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
      <div><p style={{ ...muted, color: "#7a4a2c", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" }}>Database-backed analysis</p><h1 style={{ margin: "8px 0", fontSize: 38 }}>Dealership intelligence</h1><p style={muted}>Rank valuable stock, identify ageing inventory, and surface recorded sales and enquiry trends.</p></div>
      <Link href="/admin" style={{ color: "#202321", fontWeight: 700 }}>← Dashboard</Link>
    </header>
    <p style={{ ...muted, ...panel, marginBottom: 20 }}>Updated {new Date(insights.generatedAt).toLocaleString("en-MW")}. Sales window: 90 days. Enquiry window: 30 days. Slow-stock threshold: 45 days.</p>
    <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14, marginBottom: 22 }}>
      {[
        ["Active inventory value", money(insights.inventory.activeInventoryValue)],
        ["Vehicles in stock", insights.inventory.activeVehicles],
        ["Units sold (90 days)", insights.inventory.recordedUnitsSoldLast90Days],
        ["Enquiries (30 days)", insights.inventory.enquiriesLast30Days],
        ["Slow-stock alerts", insights.inventory.staleStockCount],
      ].map(([label, value]) => <article key={String(label)} style={panel}><p style={{ ...muted, marginTop: 0 }}>{label}</p><h2 style={{ marginBottom: 0, fontSize: 27 }}>{value}</h2></article>)}
    </section>
    <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18, marginBottom: 22 }}>
      <article style={panel}><h2 style={{ marginTop: 0 }}>Highest-value stock</h2><p style={muted}>Active vehicles ranked by listed price, highest first.</p>{insights.topValue.length ? <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={th}>Vehicle</th><th style={th}>Price</th><th style={th}>Age</th></tr></thead><tbody>{insights.topValue.map((v) => <tr key={v.id}><td style={td}><strong>{v.name}</strong><div style={muted}>{v.stockNumber} · {v.status}</div></td><td style={td}>{money(v.price)}</td><td style={td}>{v.ageDays} d</td></tr>)}</tbody></table></div> : <p style={muted}>No active vehicles recorded yet.</p>}</article>
      <article style={panel}><h2 style={{ marginTop: 0 }}>Slow-moving stock</h2><p style={muted}>At least 45 days old, with no sale-item activity in the last 90 days. Review before taking action.</p>{insights.slowStock.length ? <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={th}>Vehicle</th><th style={th}>Value</th><th style={th}>Age</th></tr></thead><tbody>{insights.slowStock.map((v) => <tr key={v.id}><td style={td}><strong>{v.name}</strong><div style={muted}>{v.stockNumber}</div></td><td style={td}>{money(v.price)}</td><td style={td}>{v.ageDays} d</td></tr>)}</tbody></table></div> : <p style={muted}>No vehicles currently meet this rule. This is not proof that every vehicle is performing well.</p>}</article>
    </section>
    <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18, marginBottom: 22 }}>
      <article style={panel}><h2 style={{ marginTop: 0 }}>Hot models in recorded sales</h2><p style={muted}>Ranked by units recorded in the last 90 days, then recorded sales value.</p>{insights.hotModels.length ? <ol>{insights.hotModels.map((v) => <li key={v.name} style={{ marginBottom: 10 }}><strong>{v.name}</strong> — {v.units} unit(s), {money(v.salesValue)}</li>)}</ol> : <p style={muted}>Not enough recorded sales yet to identify hot-selling models.</p>}</article>
      <article style={panel}><h2 style={{ marginTop: 0 }}>Most common enquiry interests</h2><p style={muted}>Categories stored by the public enquiry form in the last 30 days.</p>{insights.enquiryInterests.length ? <ol>{insights.enquiryInterests.map((v) => <li key={v.interest} style={{ marginBottom: 10, textTransform: "capitalize" }}>{v.interest} — {v.enquiries} enquiry/enquiries</li>)}</ol> : <p style={muted}>No enquiries recorded in this window.</p>}</article>
    </section>
    <article style={{ ...panel, background: "#fff8e8", borderColor: "#ead7a4" }}><h2 style={{ marginTop: 0 }}>How to interpret this</h2><ul>{insights.notes.map((note) => <li key={note} style={{ marginBottom: 8 }}>{note}</li>)}</ul><p style={muted}>This is operational intelligence from your own database, not an external market-price feed. To identify national market demand and fair market prices, a trusted vehicle-market data source or API must be integrated separately.</p></article>
  </div></main>;
}

const th = { padding: "10px 8px", borderBottom: "1px solid #eef0f1", textAlign: "left" as const, fontSize: 12 };
const td = { padding: "12px 8px", borderBottom: "1px solid #eef0f1", verticalAlign: "top" as const, fontSize: 13 };
