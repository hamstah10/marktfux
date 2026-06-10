import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { formatApiError } from "@/lib/api";
import { toast } from "sonner";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await register(form);
      toast.success("Konto erstellt — wartet auf Admin-Freigabe.");
      nav("/dashboard", { replace: true });
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || "Registrierung fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-x py-20 max-w-xl">
      <div className="swiss-label text-[#16A34A]">Händler werden</div>
      <h1 className="font-display text-3xl font-bold tracking-tight mt-2">Neues Händler-Konto</h1>
      <p className="text-gray-500 mt-2 text-sm">Nach der Registrierung prüft unser Admin-Team dein Konto und schaltet es frei.</p>

      <form onSubmit={submit} className="mt-10 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Ansprechpartner *">
            <input required data-testid="reg-name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full mt-2 border border-gray-200 py-3 px-4 outline-none focus:border-[#16A34A]" />
          </Field>
          <Field label="Firma">
            <input data-testid="reg-company" value={form.company} onChange={(e) => setForm({...form, company: e.target.value})} className="w-full mt-2 border border-gray-200 py-3 px-4 outline-none focus:border-[#16A34A]" />
          </Field>
        </div>
        <Field label="E-Mail *">
          <input required type="email" data-testid="reg-email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full mt-2 border border-gray-200 py-3 px-4 outline-none focus:border-[#16A34A]" />
        </Field>
        <Field label="Telefon">
          <input data-testid="reg-phone" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="w-full mt-2 border border-gray-200 py-3 px-4 outline-none focus:border-[#16A34A]" />
        </Field>
        <Field label="Passwort * (min. 6 Zeichen)">
          <input required type="password" minLength={6} data-testid="reg-password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="w-full mt-2 border border-gray-200 py-3 px-4 outline-none focus:border-[#16A34A]" />
        </Field>

        {error && <div data-testid="reg-error" className="text-sm text-red-600 bg-red-50 border border-red-200 p-3">{error}</div>}
        <button data-testid="reg-submit" disabled={loading} className="swiss-btn-primary w-full">{loading ? "Registrieren…" : "Konto erstellen"}</button>
      </form>

      <p className="text-sm text-gray-600 mt-8">
        Bereits registriert? <Link to="/login" data-testid="link-login" className="text-[#16A34A] font-semibold hover:underline">Zum Login</Link>
      </p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="swiss-label">{label}</label>
      {children}
    </div>
  );
}
