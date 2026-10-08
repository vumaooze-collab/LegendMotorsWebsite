import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const error = params.error;

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f5f7f5", padding: 24 }}>
      <section style={{ width: "100%", maxWidth: 440, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 24, padding: 32, boxShadow: "0 20px 40px rgba(15, 23, 42, 0.08)" }}>
        <p style={{ margin: 0, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7a4a2c", fontWeight: 800, fontSize: 11 }}>
          Legend Motors
        </p>
        <h1 style={{ margin: "12px 0 8px", fontSize: 38 }}>Admin sign in</h1>
        <p style={{ margin: 0, color: "#68716d" }}>Use your dealership account to access the protected management area.</p>

        {error ? (
          <p role="alert" style={{ marginTop: 18, padding: "12px 14px", background: "#fff7ed", color: "#9a4f12", borderRadius: 12, border: "1px solid #fdba74" }}>
            {error}
          </p>
        ) : null}

        <form action={login} style={{ display: "grid", gap: 18, marginTop: 24 }}>
          <label style={{ display: "grid", gap: 8, color: "#1f2937", fontWeight: 700 }}>
            Email
            <input
              defaultValue="admin@legendmotors.local"
              name="email"
              placeholder="admin@legendmotors.local"
              required
              style={{ border: "1px solid #d1d5db", borderRadius: 12, padding: "12px 14px", fontSize: 16 }}
              type="email"
            />
          </label>

          <label style={{ display: "grid", gap: 8, color: "#1f2937", fontWeight: 700 }}>
            Password
            <input
              name="password"
              placeholder="Enter your password"
              required
              style={{ border: "1px solid #d1d5db", borderRadius: 12, padding: "12px 14px", fontSize: 16 }}
              type="password"
            />
          </label>

          <button
            style={{ border: 0, borderRadius: 999, background: "#f97316", color: "#fff", fontWeight: 800, padding: "14px 20px", cursor: "pointer" }}
            type="submit"
          >
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
