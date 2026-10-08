import Link from "next/link";

import { formatDemoPrice } from "@/data/vehicles";
import { getInventoryRecords } from "@/lib/inventory";

export default function InventoryAdminPage() {
  const vehicles = getInventoryRecords();

  return (
    <main style={{ padding: "32px 24px 80px", background: "#f5f7f5" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#7a4a2c", fontWeight: 800 }}>
              Inventory management
            </p>
            <h1 style={{ margin: "8px 0 0", fontSize: 40 }}>Vehicle stock</h1>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button type="button" style={{ background: "#f97316", color: "#fff", border: 0, borderRadius: 999, padding: "12px 20px", fontWeight: 700, cursor: "pointer" }}>
              Add vehicle
            </button>
            <Link href="/admin" style={{ background: "#111827", color: "#fff", borderRadius: 999, padding: "12px 20px", fontWeight: 700 }}>
              Dashboard
            </Link>
          </div>
        </header>

        <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 20, overflow: "hidden" }}>
          <div style={{ padding: 20, borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 28 }}>Inventory list</h2>
            </div>
            <div style={{ color: "#68716d", fontWeight: 600 }}>{vehicles.length} vehicles</div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 920 }}>
              <thead>
                <tr style={{ textAlign: "left", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12, color: "#4b5563" }}>
                  <th style={{ padding: "12px 16px" }}>Stock</th>
                  <th style={{ padding: "12px 16px" }}>Vehicle</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px" }}>Mileage</th>
                  <th style={{ padding: "12px 16px" }}>Cost</th>
                  <th style={{ padding: "12px 16px" }}>Selling</th>
                  <th style={{ padding: "12px 16px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} style={{ borderTop: "1px solid #eef0f1" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700 }}>{vehicle.stockNumber}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 700 }}>{vehicle.make} {vehicle.model}</div>
                      <div style={{ color: "#68716d", fontSize: 12 }}>{vehicle.year}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>{vehicle.status}</td>
                    <td style={{ padding: "12px 16px" }}>{vehicle.mileage.toLocaleString()} mi</td>
                    <td style={{ padding: "12px 16px" }}>{formatDemoPrice(vehicle.purchasePrice)}</td>
                    <td style={{ padding: "12px 16px" }}>{formatDemoPrice(vehicle.sellingPrice)}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button type="button" style={{ border: "1px solid #d1d5db", borderRadius: 999, padding: "8px 12px", background: "#fff", cursor: "pointer" }}>
                          Edit
                        </button>
                        <button type="button" style={{ border: "1px solid #d1d5db", borderRadius: 999, padding: "8px 12px", background: "#fff", cursor: "pointer" }}>
                          View
                        </button>
                      </div>
                    </td>
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
