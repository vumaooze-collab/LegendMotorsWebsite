"use client";

import { useEffect, useState } from "react";

import type { InventoryImage, InventoryStatus, InventoryVehicle } from "@/lib/inventory";

const fieldStyle = { width: "100%", minHeight: 42, border: "1px solid #cbd2ce", borderRadius: 4, padding: "8px 10px", background: "#fff" } as const;
const buttonStyle = { minHeight: 38, border: "1px solid #cbd2ce", borderRadius: 4, padding: "7px 11px", background: "#fff", cursor: "pointer", fontWeight: 650 } as const;
const statuses = ["AVAILABLE", "RESERVED", "SOLD", "DRAFT", "ARCHIVED"] as const;

const blankVehicle = {
  stockNumber: "",
  make: "",
  model: "",
  variant: "",
  year: new Date().getFullYear(),
  price: 0,
  currency: "MWK",
  mileage: 0,
  transmission: "Automatic",
  fuelType: "Petrol",
  drivetrain: "",
  bodyType: "",
  color: "",
  engine: "",
  condition: "",
  description: "",
  status: "DRAFT" as const,
  featured: false,
  published: false,
};

type VehicleForm = Omit<typeof blankVehicle, "status"> & { status: InventoryStatus };

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const result = await response.json();
  if (!response.ok) {
    const details = Array.isArray(result.issues)
      ? result.issues.map((issue: { message?: string }) => issue.message).filter(Boolean).join(" ")
      : "";
    throw new Error([result.error ?? "Inventory request failed.", details].filter(Boolean).join(" "));
  }
  return result as T;
}

function priceLabel(vehicle: InventoryVehicle) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: vehicle.currency, maximumFractionDigits: 0 }).format(vehicle.price);
}

export function InventoryAdmin({ canManage }: { canManage: boolean }) {
  const [vehicles, setVehicles] = useState<InventoryVehicle[]>([]);
  const [inventoryQuery, setInventoryQuery] = useState("");
  const [inventoryStatus, setInventoryStatus] = useState<InventoryStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<InventoryVehicle | null>(null);
  const [detailVehicle, setDetailVehicle] = useState<InventoryVehicle | null>(null);
  const [form, setForm] = useState<VehicleForm>(blankVehicle);
  const [imageVehicle, setImageVehicle] = useState<InventoryVehicle | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");

  const visibleVehicles = vehicles.filter((vehicle) => {
    const query = inventoryQuery.trim().toLocaleLowerCase();
    const matchesQuery = !query || [vehicle.stockNumber, vehicle.make, vehicle.model, vehicle.variant ?? "", String(vehicle.year)]
      .some((value) => value.toLocaleLowerCase().includes(query));
    return matchesQuery && (inventoryStatus === "ALL" || vehicle.status === inventoryStatus);
  });

  async function refresh() {
    const result = await requestJson<{ vehicles: InventoryVehicle[] }>("/api/admin/inventory", { cache: "no-store" });
    setVehicles(result.vehicles);
    if (imageVehicle) {
      setImageVehicle(result.vehicles.find((item) => item.id === imageVehicle.id) ?? null);
    }
  }

  useEffect(() => {
    let mounted = true;
    fetch("/api/admin/inventory", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Unable to load inventory.");
        if (mounted) setVehicles(result.vehicles);
      })
      .catch((loadError: unknown) => {
        if (mounted) setError(loadError instanceof Error ? loadError.message : "Unable to load inventory.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  function startCreate() {
    setEditing(null);
    setForm(blankVehicle);
    setShowForm(true);
    setError("");
    setNotice("");
  }

  function startEdit(vehicle: InventoryVehicle) {
    setEditing(vehicle);
    setShowForm(true);
    setForm({
      stockNumber: vehicle.stockNumber,
      make: vehicle.make,
      model: vehicle.model,
      variant: vehicle.variant ?? "",
      year: vehicle.year,
      price: vehicle.price,
      currency: vehicle.currency,
      mileage: vehicle.mileage,
      transmission: vehicle.transmission,
      fuelType: vehicle.fuelType,
      drivetrain: vehicle.drivetrain ?? "",
      bodyType: vehicle.bodyType ?? "",
      color: vehicle.color ?? "",
      engine: vehicle.engine ?? "",
      condition: vehicle.condition ?? "",
      description: vehicle.description ?? "",
      status: vehicle.status,
      featured: vehicle.featured,
      published: vehicle.published,
    });
    setError("");
    setNotice("");
  }

  async function saveVehicle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const editableFields = Object.fromEntries(Object.entries(form).filter(([key]) => key !== "status" && key !== "published"));
      const payload = editing
        ? { ...editableFields, year: Number(form.year), price: Number(form.price), mileage: Number(form.mileage) }
        : { ...form, year: Number(form.year), price: Number(form.price), mileage: Number(form.mileage) };
      const path = editing ? `/api/admin/inventory/${editing.id}` : "/api/admin/inventory";
      await requestJson(path, { method: editing ? "PATCH" : "POST", body: JSON.stringify(payload) });
      await refresh();
      setEditing(null);
      setShowForm(false);
      setNotice(editing ? "Vehicle changes saved." : "Vehicle created.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save vehicle.");
    } finally {
      setBusy(false);
    }
  }

  async function mutateVehicle(vehicle: InventoryVehicle, path: string, body?: unknown, method = "PATCH") {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await requestJson(`/api/admin/inventory/${vehicle.id}${path}`, { method, body: body === undefined ? undefined : JSON.stringify(body) });
      await refresh();
      setNotice("Inventory updated.");
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to update inventory.");
    } finally {
      setBusy(false);
    }
  }

  async function addImage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!imageVehicle) return;
    setBusy(true);
    setError("");
    try {
      await requestJson(`/api/admin/inventory/${imageVehicle.id}/images`, {
        method: "POST",
        body: JSON.stringify({ url: imageUrl, altText: imageAlt, displayOrder: imageVehicle.images.length, isPrimary: imageVehicle.images.length === 0 }),
      });
      await refresh();
      setImageUrl("");
      setImageAlt("");
      setNotice("Image record added. The URL must refer to an image hosted by an accessible storage provider.");
    } catch (imageError) {
      setError(imageError instanceof Error ? imageError.message : "Unable to add image.");
    } finally {
      setBusy(false);
    }
  }

  async function viewVehicle(vehicle: InventoryVehicle) {
    setBusy(true);
    setError("");
    try {
      const result = await requestJson<{ vehicle: InventoryVehicle }>(`/api/admin/inventory/${vehicle.id}`, { cache: "no-store" });
      setDetailVehicle(result.vehicle);
    } catch (viewError) {
      setError(viewError instanceof Error ? viewError.message : "Unable to load vehicle details.");
    } finally {
      setBusy(false);
    }
  }

  async function openImages(vehicle: InventoryVehicle) {
    setBusy(true);
    setError("");
    try {
      const result = await requestJson<{ images: InventoryImage[] }>(`/api/admin/inventory/${vehicle.id}/images`, { cache: "no-store" });
      setImageVehicle({ ...vehicle, images: result.images });
    } catch (imageError) {
      setError(imageError instanceof Error ? imageError.message : "Unable to load images.");
    } finally {
      setBusy(false);
    }
  }

  async function updateImage(image: InventoryImage, payload: Partial<InventoryImage>) {
    if (!imageVehicle) return;
    setBusy(true);
    setError("");
    try {
      await requestJson(`/api/admin/inventory/${imageVehicle.id}/images/${image.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      await refresh();
    } catch (imageError) {
      setError(imageError instanceof Error ? imageError.message : "Unable to update image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-main" style={{ minHeight: "calc(100vh - 90px)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#7a4a2c", fontWeight: 800 }}>Inventory management</p>
            <h1 style={{ margin: "8px 0 0", fontSize: 38 }}>Vehicle stock</h1>
          </div>
          {canManage && <button onClick={startCreate} style={{ ...buttonStyle, background: "#f97316", borderColor: "#f97316", color: "white", paddingInline: 18 }} type="button">Add vehicle</button>}
        </header>

        {error && <p role="alert" style={{ color: "#a51d16", background: "#fff0ee", padding: 12, border: "1px solid #e7b0aa" }}>{error}</p>}
        {notice && <p role="status" style={{ color: "#155d36", background: "#eff9f2", padding: 12, border: "1px solid #b6ddc1" }}>{notice}</p>}

        {canManage && showForm && (
          <section style={{ background: "#fff", border: "1px solid #e1e5e2", padding: 20, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 22 }}>{editing ? `Edit ${editing.stockNumber}` : "Add vehicle"}</h2>
              <button onClick={() => { setEditing(null); setShowForm(false); }} style={buttonStyle} type="button">Close</button>
            </div>
            <form onSubmit={saveVehicle}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
                {(["stockNumber", "make", "model", "variant", "year", "price", "currency", "mileage", "transmission", "fuelType", "drivetrain", "bodyType", "color", "engine", "condition"] as const).map((key) => (
                  <label key={key} style={{ display: "grid", gap: 5, fontSize: 13, fontWeight: 650 }}>
                    {key.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`)}
                    <input required={!(["variant", "drivetrain", "bodyType", "color", "engine", "condition"].includes(key))} min={key === "price" || key === "mileage" ? 0 : key === "year" ? 1990 : undefined} max={key === "year" ? new Date().getFullYear() + 2 : undefined} type={key === "year" || key === "price" || key === "mileage" ? "number" : "text"} step={key === "price" ? "0.01" : "1"} style={fieldStyle} value={String(form[key])} onChange={(event) => setForm({ ...form, [key]: key === "year" || key === "price" || key === "mileage" ? Number(event.target.value) : event.target.value })} />
                  </label>
                ))}
                {!editing && <label style={{ display: "grid", gap: 5, fontSize: 13, fontWeight: 650 }}>Status
                  <select style={fieldStyle} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as VehicleForm["status"] })}>{statuses.map((status) => <option key={status}>{status}</option>)}</select>
                </label>}
                <label style={{ display: "grid", gap: 5, fontSize: 13, fontWeight: 650 }}>Description
                  <textarea maxLength={4000} style={{ ...fieldStyle, minHeight: 84 }} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
                </label>
                <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, fontWeight: 650 }}><input type="checkbox" checked={form.featured} onChange={(event) => setForm({ ...form, featured: event.target.checked })} /> Featured</label>
                {!editing && <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, fontWeight: 650 }}><input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} /> Published</label>}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button disabled={busy} style={{ ...buttonStyle, background: "#202321", color: "white" }} type="submit">{busy ? "Saving…" : editing ? "Save changes" : "Create vehicle"}</button>
                <button onClick={() => { setEditing(null); setShowForm(false); }} style={buttonStyle} type="button">Cancel</button>
              </div>
            </form>
          </section>
        )}

        <section style={{ background: "#fff", border: "1px solid #e1e5e2", overflow: "hidden" }}>
          <div style={{ padding: 18, borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: 22 }}>Inventory list</h2>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <label className="admin-filter-label">Search inventory<input aria-label="Search inventory" onChange={(event) => setInventoryQuery(event.target.value)} placeholder="Stock, make, model or year" type="search" value={inventoryQuery} style={{ ...fieldStyle, minWidth: 220 }} /></label>
              <label className="admin-filter-label">Status<select aria-label="Filter inventory by status" onChange={(event) => setInventoryStatus(event.target.value as InventoryStatus | "ALL")} value={inventoryStatus} style={{ ...fieldStyle, minWidth: 150 }}><option value="ALL">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
              <span aria-live="polite">{visibleVehicles.length} of {vehicles.length} vehicles</span>
            </div>
          </div>
          {loading ? <p style={{ padding: 20 }}>Loading inventory…</p> : visibleVehicles.length === 0 ? <p style={{ padding: 20 }}>{vehicles.length === 0 ? "No vehicles have been recorded." : "No vehicles match the current search and status filter."}</p> : (
            <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1050 }}>
              <thead><tr style={{ textAlign: "left", color: "#4b5563", fontSize: 12, textTransform: "uppercase" }}>{["Stock", "Vehicle", "Status", "Mileage", "Price", "Published", "Images", "Actions"].map((heading) => <th key={heading} style={{ padding: "12px 14px" }}>{heading}</th>)}</tr></thead>
              <tbody>{visibleVehicles.map((vehicle) => <tr key={vehicle.id} style={{ borderTop: "1px solid #eef0f1" }}>
                <td style={{ padding: "12px 14px", fontWeight: 700 }}>{vehicle.stockNumber}</td><td style={{ padding: "12px 14px" }}>{vehicle.year} {vehicle.make} {vehicle.model}</td>
                <td style={{ padding: "12px 14px" }}><select aria-label={`Status for ${vehicle.stockNumber}`} disabled={busy || !canManage} style={fieldStyle} value={vehicle.status} onChange={(event) => void mutateVehicle(vehicle, "/status", { status: event.target.value })}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></td>
                <td style={{ padding: "12px 14px" }}>{vehicle.mileage.toLocaleString()} km</td><td style={{ padding: "12px 14px" }}>{priceLabel(vehicle)}</td><td style={{ padding: "12px 14px" }}>{vehicle.published ? "Yes" : "No"}</td><td style={{ padding: "12px 14px" }}>{vehicle.images.length}</td>
                <td style={{ padding: "12px 14px" }}><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button disabled={busy} onClick={() => void viewVehicle(vehicle)} style={buttonStyle} type="button">View</button>
                  <button disabled={busy} onClick={() => void openImages(vehicle)} style={buttonStyle} type="button">Images</button>
                  {canManage && <>
                    <button disabled={busy} onClick={() => startEdit(vehicle)} style={buttonStyle} type="button">Edit</button>
                    <button disabled={busy} onClick={() => void mutateVehicle(vehicle, "/publish", { published: !vehicle.published })} style={buttonStyle} type="button">{vehicle.published ? "Unpublish" : "Publish"}</button>
                    {vehicle.status !== "ARCHIVED" && <button disabled={busy} onClick={() => { if (window.confirm(`Archive ${vehicle.stockNumber}?`)) void mutateVehicle(vehicle, "", undefined, "DELETE"); }} style={buttonStyle} type="button">Archive</button>}
                  </>}
                </div></td>
              </tr>)}</tbody>
            </table></div>
          )}
        </section>

        {detailVehicle && (
          <section style={{ background: "#fff", border: "1px solid #e1e5e2", padding: 20, marginTop: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><h2 style={{ margin: 0, fontSize: 22 }}>{detailVehicle.stockNumber}: {detailVehicle.year} {detailVehicle.make} {detailVehicle.model}</h2><button onClick={() => setDetailVehicle(null)} style={buttonStyle} type="button">Close</button></div>
            <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
              {(["variant", "price", "currency", "mileage", "transmission", "fuelType", "drivetrain", "bodyType", "color", "engine", "condition", "status", "published", "featured", "description"] as const).map((key) => <div key={key}><dt style={{ color: "#68716d", fontSize: 12 }}>{key}</dt><dd style={{ margin: 0 }}>{String(detailVehicle[key] ?? "Not specified")}</dd></div>)}
            </dl>
          </section>
        )}

        {imageVehicle && (
          <section style={{ background: "#fff", border: "1px solid #e1e5e2", padding: 20, marginTop: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><h2 style={{ margin: 0, fontSize: 22 }}>Images: {imageVehicle.stockNumber}</h2><button onClick={() => setImageVehicle(null)} style={buttonStyle} type="button">Close</button></div>
            <p style={{ color: "#68716d" }}>This records an externally hosted image URL and metadata; it does not upload image files.</p>
            {canManage && <form onSubmit={addImage} style={{ display: "grid", gridTemplateColumns: "minmax(220px, 2fr) minmax(180px, 1fr) auto", gap: 10, margin: "16px 0" }}>
              <input aria-label="Image URL" placeholder="https://…" required type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} style={fieldStyle} />
              <input aria-label="Image description" placeholder="Alt text" maxLength={160} value={imageAlt} onChange={(event) => setImageAlt(event.target.value)} style={fieldStyle} />
              <button disabled={busy} style={buttonStyle} type="submit">Add image URL</button>
            </form>}
            <div style={{ display: "grid", gap: 8 }}>{imageVehicle.images.map((image) => <div key={image.id} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 10, alignItems: "center", borderTop: "1px solid #e5e7eb", paddingTop: 10 }}>
              <div style={{ minWidth: 0 }}><a href={image.url} rel="noreferrer" target="_blank" style={{ color: "#1261a0", overflowWrap: "anywhere" }}>{image.url}</a><div style={{ color: "#68716d", fontSize: 13 }}>{image.altText || "No alt text"} · order {image.displayOrder}{image.isPrimary ? " · primary" : ""}</div></div>
              {canManage && <div style={{ display: "flex", gap: 6 }}>
                {!image.isPrimary && <button disabled={busy} onClick={() => void updateImage(image, { isPrimary: true })} style={buttonStyle} type="button">Set primary</button>}
                <button disabled={busy} onClick={() => void updateImage(image, { displayOrder: Math.max(0, image.displayOrder - 1) })} style={buttonStyle} type="button">Up</button>
                <button disabled={busy} onClick={() => void updateImage(image, { displayOrder: image.displayOrder + 1 })} style={buttonStyle} type="button">Down</button>
                <button disabled={busy} onClick={() => void mutateVehicle(imageVehicle, `/images/${image.id}`, undefined, "DELETE")} style={buttonStyle} type="button">Remove</button>
              </div>}
            </div>)}</div>
          </section>
        )}
      </div>
    </main>
  );
}
