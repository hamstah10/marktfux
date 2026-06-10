import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { formatApiError } from "@/lib/api";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const u = await login(form.email, form.password);
      toast.success("Willkommen zurück!");
      const dest = loc.state?.from || (u.role === "admin" ? "/admin" : "/dashboard");
      nav(dest, { replace: true });
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || "Login fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrap py-20 max-w-md">
      <div className="swiss-label text-[#16A34A]">Login</div>
      <h1 className="font-display text-3xl font-bold tracking-tight mt-2">Willkommen zurück</h1>
      <p className="text-gray-500 mt-2 text-sm">Melde dich an, um Inserate zu verwalten.</p>

      <form onSubmit={submit} className="mt-10 space-y-4">
        <div>
          <label className="swiss-label">E-Mail</label>
          <input required type="email" data-testid="login-email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full mt-2 border border-gray-200 py-3 px-4 outline-none focus:border-[#16A34A]" />
        </div>
        <div>
          <label className="swiss-label">Passwort</label>
          <input required type="password" data-testid="login-password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="w-full mt-2 border border-gray-200 py-3 px-4 outline-none focus:border-[#16A34A]" />
        </div>
        {error && <div data-testid="login-error" className="text-sm text-red-600 bg-red-50 border border-red-200 p-3">{error}</div>}
        <button data-testid="login-submit" disabled={loading} className="swiss-btn-primary w-full">{loading ? "Anmelden…" : "Anmelden"}</button>
      </form>

      <p className="text-sm text-gray-600 mt-8">
        Noch kein Konto? <Link to="/register" data-testid="link-register" className="text-[#16A34A] font-semibold hover:underline">Händler registrieren</Link>
      </p>
    </div>
  );
}
