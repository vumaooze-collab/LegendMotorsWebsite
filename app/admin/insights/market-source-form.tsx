"use client";

import { useState } from "react";

export default function MarketSourceForm({ initialUrl }: { initialUrl: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/market-source", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save the feed URL.");
      setMessage(result.message || "Saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save the feed URL.");
    } finally {
      setBusy(false);
    }
  }

  return <form onSubmit={save} style={{ display: "grid", gap: 10 }}>
    <label htmlFor="market-feed-url" style={{ fontWeight: 700 }}>Public market-news RSS/Atom feed URL</label>
    <input id="market-feed-url" type="url" inputMode="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/vehicles/feed.xml" maxLength={2048} style={{ width: "100%", padding: 12, border: "1px solid #d1d5db", borderRadius: 10 }} />
    <p style={{ color: "#68716d", fontSize: 13, margin: 0 }}>Use a public HTTPS RSS or Atom feed URL. The feed is read when intelligence is refreshed; only its published entries are analysed. Leave blank to disconnect it.</p>
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <button type="submit" disabled={busy} style={{ background: "#7a4a2c", color: "#fff", border: 0, borderRadius: 999, padding: "11px 18px", fontWeight: 700, cursor: busy ? "wait" : "pointer" }}>{busy ? "Saving…" : "Save market source"}</button>
      {message ? <span role="status" style={{ fontSize: 13 }}>{message}</span> : null}
    </div>
  </form>;
}
