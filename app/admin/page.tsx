import Link from "next/link";

import { listInventoryVehicles } from "@/lib/inventory";

export const dynamic = "force-dynamic";

function formatPrice(price: number) {
  return `MWK ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(price)}`;
}

export default async function AdminDashboardPage() {
  const vehicles = await listInventoryVehicles();
  const summary = {
    total: vehicles.length,
    available: vehicles.filter((vehicle) => vehicle.status === "AVAILABLE").length,
    reserved: vehicles.filter((vehicle) => vehicle.status === "RESERVED").length,
    sold: vehicles.filter((vehicle) => vehicle.status === "SOLD").length,
    published: vehicles.filter((vehicle) => vehicle.published).length,
    inventoryValue: vehicles.filter((vehicle) => vehicle.status !== "SOLD" && vehicle.status !== "ARCHIVED").reduce((total, vehicle) => total + vehicle.price, 0),
  };

  return (
    <main className="admin-main">
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, gap: 16 }}>
          <div>
            <p style={{ margin: 0, letterSpacing: "0.14em", textTransform: "uppercase", color: "#7a4a2c", fontWeight: 800, fontSize: 11 }}>
              Legend Motors
            </p>
            <h1 style={{ margin: "8px 0 0", fontSize: 42, lineHeight: 1.1 }}>Dashboard</h1>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/admin/inventory" style={{ background: "#f97316", color: "#fff", borderRadius: 999, padding: "12px 20px", fontWeight: 700 }}>
              Inventory
            </Link>
            <Link href="/" style={{ background: "#202321", color: "#fff", borderRadius: 999, padding: "12px 20px", fontWeight: 700 }}>
              Public site
            </Link>
          </div>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 28 }}>
          {([
            ["Total vehicles", summary.total, "#111827"],
            ["Available vehicles", summary.available, "#0f766e"],
            ["Reserved vehicles", summary.reserved, "#7c3aed"],
            ["Sold vehicles", summary.sold, "#a33a25"],
            ["Published vehicles", summary.published, "#2563eb"],
            ["Current inventory value", formatPrice(summary.inventoryValue), "#f59e0b"],
          ] as Array<[string, string | number, string]>).map(([label, value, color]) => (
            <article key={label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: 20, boxShadow: "0 10px 30px rgba(15,23,42,0.04)" }}>
              <p style={{ margin: 0, color: "#68716d", fontSize: 13, fontWeight: 600 }}>{label}</p>
              <h2 style={{ margin: "12px 0 0", color, fontSize: 32 }}>{String(value)}</h2>
            </article>
          ))}
        </section>

        <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 20, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div>
              <p style={{ margin: 0, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7a4a2c", fontWeight: 800, fontSize: 11 }}>
                Overview
              </p>
              <h2 style={{ margin: "8px 0 0", fontSize: 28 }}>Current inventory</h2>
            </div>
            <Link href="/admin/inventory" style={{ color: "#1f2937", fontWeight: 700 }}>
              Manage inventory →
            </Link>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
              <thead>
                <tr style={{ textAlign: "left", color: "#4b5563", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  <th style={{ padding: "10px 12px" }}>Vehicle</th>
                  <th style={{ padding: "10px 12px" }}>Status</th>
                  <th style={{ padding: "10px 12px" }}>Mileage</th>
                  <th style={{ padding: "10px 12px" }}>Price</th>
                  <th style={{ padding: "10px 12px" }}>Published</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.slice(0, 5).map((vehicle) => (
                  <tr key={vehicle.id} style={{ borderTop: "1px solid #eef0f1" }}>
                    <td style={{ padding: "12px", fontWeight: 700 }}>{vehicle.make} {vehicle.model}</td>
                    <td style={{ padding: "12px" }}>{vehicle.status}</td>
                    <td style={{ padding: "12px" }}>{vehicle.mileage.toLocaleString()} km</td>
                    <td style={{ padding: "12px" }}>{formatPrice(vehicle.price)}</td>
                    <td style={{ padding: "12px" }}>{vehicle.published ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
