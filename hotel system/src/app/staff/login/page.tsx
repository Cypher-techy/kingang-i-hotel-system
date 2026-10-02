"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function StaffLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/staff/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Login failed");
      router.push("/staff");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return <main className="login-page"><div className="login-image"><div className="login-image-overlay"><a href="/" className="login-brand"><span className="brand-mark">K</span><span><strong>KING’ANG’I</strong><small>HOTEL</small></span></a><div className="login-quote"><div className="eyebrow">The work behind the welcome</div><h1 className="serif">Good operations<br />make warm hospitality<br /><em>possible.</em></h1><p>One secure space for the teams making every King’ang’i moment count.</p></div></div></div><section className="login-panel"><div className="login-panel-inner"><a href="/" className="back-home">← Back to public website</a><div className="login-heading"><div className="eyebrow" style={{ color: "#8cae16" }}>Team access</div><h2 className="serif">Welcome back.</h2><p>Sign in to manage today at King’ang’i Hotel.</p></div><form onSubmit={submit} className="login-form"><label>Email address<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@kingangi.co.ke" /></label><label>Password<input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter your password" /></label>{error && <div className="login-error">{error}</div>}<button className="btn btn-dark" disabled={loading}>{loading ? "Signing in…" : "Sign in to dashboard"}<span>→</span></button></form><div className="login-help"><strong>New installation?</strong><span>The first owner account is created from your server environment. See the setup notes for the initial credentials and how to change them.</span></div><p className="login-footer">Protected staff area · King’ang’i Hotel · © {new Date().getFullYear()}</p></div></section></main>;
}
