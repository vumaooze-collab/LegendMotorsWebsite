import Link from "next/link";
import { createCustomer } from "./actions";
import { hasPermission } from "@/lib/auth/authorization";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

type CustomersPageProps = {
  searchParams?: Promise<{ created?: string; error?: string }>;
};

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const user = await getCurrentUser();
  const canManage = hasPermission(user, "customers:manage");
  const params = searchParams ? await searchParams : {};
  const customers = await prisma.customer.findMany({
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: { _count: { select: { enquiries: true, sales: true } } },
  });

  return (
    <main className="admin-main">
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <header style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "end", gap: 16, marginBottom: 24 }}>
          <div>
            <p style={{ margin: 0, color: "#7a4a2c", fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" }}>Customer relationships</p>
            <h1 style={{ margin: "8px 0 0", fontSize: 38, lineHeight: 1.1 }}>Customers</h1>
            <p style={{ color: "#68716d", marginBottom: 0 }}>Keep customer contact details and dealership follow-up notes in one place.</p>
          </div>
          <Link href="/admin" style={{ color: "#202321", fontWeight: 700 }}>← Dashboard</Link>
        </header>

        {params.created ? <p role="status" style={{ padding: 14, background: "#edf7ef", border: "1px solid #b9dfc0", borderRadius: 8 }}>Customer saved successfully.</p> : null}
        {params.error ? <p role="alert" style={{ padding: 14, background: "#fff0ed", border: "1px solid #f0c2b8", borderRadius: 8 }}>{params.error}</p> : null}

        {canManage ? (
          <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 22, marginBottom: 24 }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 22 }}>Add a customer</h2>
            <form action={createCustomer} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 700 }}>Full name <input name="name" required minLength={2} maxLength={120} autoComplete="name" style={fieldStyle} /></label>
              <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 700 }}>Phone / WhatsApp <input name="phone" type="tel" maxLength={40} autoComplete="tel" style={fieldStyle} /></label>
              <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 700 }}>Email <input name="email" type="email" maxLength={254} autoComplete="email" style={fieldStyle} /></label>
              <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 700 }}>Address / area <input name="address" maxLength={240} autoComplete="street-address" style={fieldStyle} /></label>
              <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 700, gridColumn: "1 / -1" }}>Notes <textarea name="notes" rows={3} maxLength={2000} placeholder="Vehicle interests, preferred contact time, or follow-up notes" style={{ ...fieldStyle, resize: "vertical" }} /></label>
              <div><button type="submit" className="button button--charcoal">Save customer <span aria-hidden="true">→</span></button></div>
            </form>
          </section>
        ) : null}

        <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: 20, borderBottom: "1px solid #eef0f1" }}>
            <div><h2 style={{ margin: 0, fontSize: 22 }}>Customer directory</h2><p style={{ margin: "4px 0 0", color: "#68716d", fontSize: 13 }}>Showing the latest {customers.length} records (maximum 200).</p></div>
            <span style={{ background: "#f6f7f6", borderRadius: 8, padding: "7px 10px", fontWeight: 800 }}>{customers.length}</span>
          </div>
          {customers.length ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                <thead><tr style={{ textAlign: "left", color: "#68716d", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {["Customer", "Contact", "Address", "Enquiries", "Sales", "Updated"].map((label) => <th key={label} style={{ padding: "13px 16px" }}>{label}</th>)}
                </tr></thead>
                <tbody>{customers.map((customer) => <tr key={customer.id} style={{ borderTop: "1px solid #eef0f1" }}>
                  <td style={{ padding: "14px 16px", fontWeight: 750 }}>{customer.name}{customer.notes ? <p style={{ maxWidth: 260, margin: "4px 0 0", color: "#68716d", fontSize: 12, fontWeight: 400 }}>{customer.notes}</p> : null}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13 }}>{customer.phone ? <div>{customer.phone}</div> : null}{customer.email ? <div>{customer.email}</div> : null}{!customer.phone && !customer.email ? "—" : null}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13 }}>{customer.address || "—"}</td>
                  <td style={{ padding: "14px 16px" }}>{customer._count.enquiries}</td>
                  <td style={{ padding: "14px 16px" }}>{customer._count.sales}</td>
                  <td style={{ padding: "14px 16px", whiteSpace: "nowrap", fontSize: 12 }}>{customer.updatedAt.toLocaleDateString("en-GB")}</td>
                </tr>)}</tbody>
              </table>
            </div>
          ) : <div style={{ padding: 34, textAlign: "center" }}><h3 style={{ marginTop: 0 }}>No customers yet</h3><p style={{ color: "#68716d" }}>Add your first customer above. Real customer data will appear here once saved.</p></div>}
        </section>
      </div>
    </main>
  );
}

const fieldStyle = {
  width: "100%",
  minHeight: 44,
  padding: "10px 12px",
  border: "1px solid #cfd5d1",
  borderRadius: 6,
  background: "#fff",
  color: "#202321",
  fontWeight: 400,
} as const;
