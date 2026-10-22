"use client";

import { useState } from "react";

const columns = [
  "stockNumber", "make", "model", "year", "price", "mileage",
  "transmission", "fuelType", "currency", "variant", "bodyType",
  "color", "engine", "condition", "drivetrain", "description",
];

const template = [
  columns.join(","),
  'LM-001,Toyota,Harrier,2018,18500000,72000,Automatic,Petrol,MWK,Premium SUV,SUV,Black,2.0L,Used,AWD,"Service history available"',
  'LM-002,Honda,Fit,2017,7800000,68000,Automatic,Petrol,MWK,Hybrid,Hatchback,White,1.5L,Used,FWD,"Clean interior"',
].join("\n");

function parseCsv(source: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (char === '"' && quoted && source[i + 1] === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && source[i + 1] === "\n") i += 1;
      row.push(cell.trim());
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell.trim());
  if (row.some((value) => value.length > 0)) rows.push(row);
  if (quoted) throw new Error("CSV has an unclosed quote.");
  return rows;
}

export function InventoryCsvImport({ canManage }: { canManage: boolean }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob([template], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "legend-motors-inventory-template.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importFile(file?: File) {
    if (!file) return;
    setBusy(true);
    setMessage("");
    setErrors([]);
    try {
      if (file.size > 1_000_000) throw new Error("CSV must be smaller than 1 MB.");
      const rows = parseCsv(await file.text());
      if (rows.length < 2) throw new Error("Add a header row and at least one vehicle.");
      const headers = rows[0].map((header) => header.replace(/^\uFEFF/, ""));
      const missing = ["stockNumber", "make", "model", "year", "price", "mileage", "transmission", "fuelType"]
        .filter((required) => !headers.includes(required));
      if (missing.length) throw new Error("Missing required columns: " + missing.join(", "));
      const records = rows.slice(1);
      if (records.length > 100) throw new Error("Import up to 100 vehicles per CSV file.");
      let imported = 0;
      const failed: string[] = [];
      for (let index = 0; index < records.length; index += 1) {
        const cells = records[index];
        const rowNumber = index + 2;
        const record = Object.fromEntries(headers.map((header, column) => [header, cells[column] ?? ""]));
        const payload = {
          ...record,
          year: Number(record.year),
          price: Number(record.price),
          mileage: Number(record.mileage),
          currency: record.currency || "MWK",
          status: "DRAFT",
          published: false,
          featured: false,
          images: [],
        };
        try {
          const response = await fetch("/api/admin/inventory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error ?? "Could not create vehicle.");
          imported += 1;
        } catch (error) {
          failed.push("Row " + rowNumber + " (" + (record.stockNumber || "no stock number") + "): " +
            (error instanceof Error ? error.message : "Import failed."));
        }
      }
      setMessage(imported + " vehicle(s) imported as unpublished drafts. " +
        (failed.length ? failed.length + " row(s) need correction." : "All rows imported successfully."));
      setErrors(failed);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to import this CSV.");
    } finally {
      setBusy(false);
    }
  }

  if (!canManage) return null;

  return (
    <section style={{ background: "#fff", border: "1px solid #e1e5e2", padding: 20, marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: 0, color: "#7a4a2c", fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>Bulk inventory</p>
          <h2 style={{ margin: "6px 0", fontSize: 22 }}>Add many vehicles at once</h2>
          <p style={{ margin: 0, color: "#68716d", fontSize: 14 }}>Import up to 100 vehicles from a CSV file. Imported cars stay as drafts until you add photos and publish them.</p>
        </div>
        <button type="button" onClick={downloadTemplate} style={{ border: "1px solid #cbd2ce", borderRadius: 4, padding: "10px 14px", background: "#fff", cursor: "pointer", fontWeight: 700 }}>Download CSV template</button>
      </div>
      <label style={{ display: "grid", gap: 8, marginTop: 16, fontWeight: 650, fontSize: 14 }}>
        Select inventory CSV
        <input type="file" accept=".csv,text/csv" disabled={busy} onChange={(event) => { void importFile(event.target.files?.[0]); event.currentTarget.value = ""; }} />
      </label>
      {busy && <p role="status">Importing vehicles… Please keep this page open.</p>}
      {message && <p role="status" style={{ marginTop: 12, padding: 12, background: "#f5f7f6", border: "1px solid #dfe5e1" }}>{message}</p>}
      {errors.length > 0 && <ul style={{ color: "#a51d16", paddingLeft: 22 }}>{errors.map((error) => <li key={error}>{error}</li>)}</ul>}
    </section>
  );
}
