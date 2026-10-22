import Link from "next/link";
import { createSale } from "./actions";
import { hasPermission } from "@/lib/auth/authorization";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

type SalesPageProps = { searchParams?: Promise<{ created?: string; error?: string }> };

function formatMoney(amount: number | string) {
  return `MWK ${new Intl.NumberFormat("en-MW", { maximumFractionDigits: 0 }).format(Number(amount))}`;
}

export default async function SalesPage({ searchParams }: SalesPageProps) {
  const user = await getCurrentUser();
  const canManage = hasPermission(user, "sales:manage");
  const params = searchParams ? await searchParams : {};
  const [sales, customers, vehicles] = await Promise.all([
    prisma.sale.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { customer: true, saleItems: { include: { vehicle: true } } } }),
    prisma.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true }, take: 500 }),
    prisma.vehicle.findMany({ where: { status: "AVAILABLE", published: true }, orderBy: [{ featured: "desc" }, { createdAt: "desc" }], select: { id: true, make: true, model: true, year: true, price: true, stockNumber: true }, take: 200 }),
  ]);

  return <main className="admin-main"><div style={{ maxWidth: 1280, margin: "0 auto" }}>
    <header style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "end", gap: 16, marginBottom: 24 }}>
      <div><p style={{ margin: 0, color: "#7a4a2c", fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" }}>Dealership operations</p><h1 style={{ margin: "8px 0 0", fontSize: 38 }}>Sales</h1><p style={{ color: "#68716d", marginBottom: 0 }}>Record vehicle sales and track deposits and outstanding balances.</p></div>
      <Link href="/admin" style={{ color: "#202321", fontWeight: 700 }}>← Dashboard</Link>
    </header>
    {params.created ? <p role="status" style={{ padding: 14, background: "#edf7ef", border: "1px solid #b9dfc0", borderRadius: 8 }}>Sale recorded. The vehicle has been marked sold and removed from public inventory.</p> : null}
    {params.error ? <p role="alert" style={{ padding: 14, background: "#fff0ed", border: "1px solid #f0c2b8", borderRadius: 8 }}>{params.error}</p> : null}
    {canManage ? <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 22, marginBottom: 24 }}>
      <h2 style={{ margin: "0 0 16px", fontSize: 22 }}>Record a vehicle sale</h2>
      {vehicles.length ? <form action={createSale} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        <label style={labelStyle}>Available vehicle<select name="vehicleId" required style={fieldStyle} defaultValue=""><option value="" disabled>Select a published vehicle</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.year} {vehicle.make} {vehicle.model} · {vehicle.stockNumber} · {formatMoney(Number(vehicle.price))}</option>)}</select></label>
        <label style={labelStyle}>Customer (optional)<select name="customerId" style={fieldStyle} defaultValue=""><option value="">No customer linked</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
        <label style={labelStyle}>Deposit received (MWK)<input name="depositAmount" type="number" min="0" step="1" defaultValue="0" required style={fieldStyle}/></label>
        <div style={{ alignSelf: "end" }}><button className="button button--charcoal" type="submit">Record sale →</button></div>
      </form> : <p style={{ color: "#68716d" }}>There are no published available vehicles to record as sold. Add and publish verified inventory first.</p>}
      <p style={{ color: "#68716d", fontSize: 12, marginBottom: 0 }}>Recording a sale marks the selected vehicle SOLD and unpublishes it. Confirm the vehicle and deposit before submitting.</p>
    </section> : null}
    <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: 20, borderBottom: "1px solid #eef0f1" }}><h2 style={{ margin: 0, fontSize: 22 }}>Recent sales</h2><p style={{ margin: "4px 0 0", color: "#68716d", fontSize: 13 }}>Latest {sales.length} records (maximum 100).</p></div>
      {sales.length ? <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}><thead><tr style={{ textAlign: "left", color: "#68716d", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>{["Sale reference", "Vehicle", "Customer", "Total", "Deposit", "Balance", "Date"].map((label) => <th key={label} style={{ padding: "13px 16px" }}>{label}</th>)}</tr></thead><tbody>{sales.map((sale) => <tr key={sale.id} style={{ borderTop: "1px solid #eef0f1" }}>
      <td style={{ padding: "14px 16px", fontWeight: 750 }}>{sale.saleNumber}<div style={{ color: "#68716d", fontSize: 11 }}>{sale.status}</div></td>
      <td style={{ padding: "14px 16px" }}>{sale.saleItems.map((item) => <div key={item.id}>{item.vehicle.year} {item.vehicle.make} {item.vehicle.model}</div>)}</td>
      <td style={{ padding: "14px 16px" }}>{sale.customer?.name ?? "Not linked"}</td>
      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>{formatMoney(Number(sale.totalAmount))}</td><td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>{formatMoney(Number(sale.depositAmount ?? 0))}</td><td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>{formatMoney(Number(sale.balanceAmount ?? sale.totalAmount))}</td><td style={{ padding: "14px 16px", whiteSpace: "nowrap", fontSize: 12 }}>{sale.createdAt.toLocaleDateString("en-GB")}</td>
    </tr>)}</tbody></table></div> : <div style={{ padding: 34, textAlign: "center" }}><h3 style={{ marginTop: 0 }}>No sales recorded</h3><p style={{ color: "#68716d" }}>Recorded vehicle sales will appear here.</p></div>}
    </section>
  </div></main>;
}

const labelStyle = { display: "grid", gap: 6, fontSize: 13, fontWeight: 700 } as const;
const fieldStyle = { width: "100%", minHeight: 44, padding: "10px 12px", border: "1px solid #cfd5d1", borderRadius: 6, background: "#fff", color: "#202321", fontWeight: 400 } as const;
