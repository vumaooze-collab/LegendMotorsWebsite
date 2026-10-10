import Link from "next/link";
import { login } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const params = searchParams ? await searchParams : {};
  const error = params.error;

  return <main className="login-page">
    <section className="login-panel">
      <Link className="brand-lockup" href="/" aria-label="Legend Motors home">
        <span className="brand-mark" aria-hidden="true">LM</span><span className="brand-name">Legend Motors<small>Administration</small></span>
      </Link>
      <h1>Sign in</h1>
      <p>Use your dealership account to access the protected inventory management area.</p>
      {error ? <p role="alert" className="login-error">{error}</p> : null}
      <form action={login}>
        <label>Email<input autoComplete="username" name="email" placeholder="Email address" required type="email" /></label>
        <label>Password<input autoComplete="current-password" name="password" placeholder="Enter your password" required type="password" /></label>
        <button type="submit">Sign in to admin</button>
      </form>
    </section>
  </main>;
}
