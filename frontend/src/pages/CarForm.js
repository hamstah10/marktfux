import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, imgUrl, formatApiError, API } from "@/lib/api";
import { toast } from "sonner";
import { Sparkles, Upload, X, Loader2 } from "lucide-react";

const FUELS = ["Benzin", "Diesel", "Elektro", "Hybrid", "LPG/Autogas"];
const TRANS = ["Schaltung", "Automatik"];

const empty = {
  title: "", brand: "", model: "", year: new Date().getFullYear(),
  price: "", mileage: "", fuel: "Benzin", transmission: "Schaltung",
  power_hp: "", description: "", location: "", images: [],
};

export default function CarForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    if (id) {
      api.get(`/dealer/vehicles/${id}`).then(r => setForm(r.data)).catch(() => toast.error("Inserat nicht gefunden"));
    }
  }, [id]);

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    const payload = {
      ...form,
      year: parseInt(form.year),
      price: parseFloat(form.price),
      mileage: parseInt(form.mileage),
      power_hp: parseInt(form.power_hp),
    };
    try {
      if (id) {
        await api.patch(`/dealer/vehicles/${id}`, payload);
        toast.success("Aktualisiert");
      } else {
        await api.post("/dealer/vehicles", payload);
        toast.success("Inserat veröffentlicht");
      }
      nav("/dashboard");
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || "Speichern fehlgeschlagen");
    } finally { setLoading(false); }
  };

  const onUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const { data } = await api.post("/files/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
        setForm(f => ({ ...f, images: [...(f.images || []), data.path] }));
      } catch (err) {
        toast.error(formatApiError(err.response?.data?.detail) || "Upload fehlgeschlagen");
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeImage = (p) => setForm(f => ({ ...f, images: f.images.filter(x => x !== p) }));

  const generateAI = async () => {
    if (!form.brand || !form.model || !form.year) {
      toast.error("Bitte zuerst Marke, Modell, Baujahr ausfüllen.");
      return;
    }
    setAiBusy(true);
    setForm(f => ({ ...f, description: "" }));
    try {
      const token = localStorage.getItem("am_token");
      const res = await fetch(`${API}/ai/describe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          brand: form.brand, model: form.model, year: parseInt(form.year) || 0,
          mileage: parseInt(form.mileage) || 0, fuel: form.fuel,
          transmission: form.transmission, power_hp: parseInt(form.power_hp) || 0,
          extra: "",
        }),
      });
      if (!res.ok) throw new Error("AI-Fehler");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";
        for (const ev of events) {
          const lines = ev.split("\n");
          let isData = false, isEvent = null, payload = "";
          for (const l of lines) {
            if (l.startsWith("event:")) isEvent = l.slice(6).trim();
            else if (l.startsWith("data:")) { isData = true; payload += l.slice(5).trim(); }
          }
          if (isEvent === "done") continue;
          if (isEvent === "error") { toast.error(payload); continue; }
          if (isData) {
            const text = payload.replace(/\\n/g, "\n");
            setForm(f => ({ ...f, description: (f.description || "") + text }));
          }
        }
      }
      toast.success("Beschreibung generiert");
    } catch (e) {
      toast.error("KI-Generierung fehlgeschlagen");
    } finally { setAiBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-8 max-w-4xl">
      <div className="swiss-card p-6">
        <h3 className="swiss-label text-[#16A34A] mb-4">Grunddaten</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <F label="Inserats-Titel *"><input required data-testid="vf-title" value={form.title} onChange={e=>upd("title", e.target.value)} className={inp} /></F>
          <F label="Marke *"><input required data-testid="vf-brand" value={form.brand} onChange={e=>upd("brand", e.target.value)} className={inp} /></F>
          <F label="Modell *"><input required data-testid="vf-model" value={form.model} onChange={e=>upd("model", e.target.value)} className={inp} /></F>
          <F label="Baujahr *"><input required type="number" min="1950" max="2030" data-testid="vf-year" value={form.year} onChange={e=>upd("year", e.target.value)} className={inp} /></F>
          <F label="Preis € *"><input required type="number" min="0" data-testid="vf-price" value={form.price} onChange={e=>upd("price", e.target.value)} className={inp} /></F>
          <F label="Kilometerstand *"><input required type="number" min="0" data-testid="vf-mileage" value={form.mileage} onChange={e=>upd("mileage", e.target.value)} className={inp} /></F>
          <F label="Kraftstoff *">
            <select data-testid="vf-fuel" value={form.fuel} onChange={e=>upd("fuel", e.target.value)} className={inp}>
              {FUELS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </F>
          <F label="Getriebe *">
            <select data-testid="vf-transmission" value={form.transmission} onChange={e=>upd("transmission", e.target.value)} className={inp}>
              {TRANS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </F>
          <F label="Leistung (PS) *"><input required type="number" min="0" data-testid="vf-power" value={form.power_hp} onChange={e=>upd("power_hp", e.target.value)} className={inp} /></F>
          <F label="Standort *"><input required data-testid="vf-location" value={form.location} onChange={e=>upd("location", e.target.value)} className={inp} /></F>
        </div>
      </div>

      <div className="swiss-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="swiss-label text-[#16A34A]">Bilder</h3>
          <button type="button" data-testid="vf-upload-btn" onClick={() => fileRef.current?.click()} className="swiss-btn-secondary text-sm py-2 px-4">
            <Upload className="w-4 h-4" /> Bilder hochladen
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={onUpload} className="hidden" data-testid="vf-file-input" />
        </div>
        {form.images?.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-8 border border-dashed border-gray-300">Noch keine Bilder. Empfohlen: 4-8 hochwertige Aufnahmen.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {form.images.map((p, i) => (
              <div key={p+i} className="relative aspect-[4/3] bg-gray-100 group">
                <img src={imgUrl(p)} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(p)} data-testid={`vf-remove-img-${i}`} className="absolute top-1 right-1 bg-white text-[#16A34A] p-1 opacity-0 group-hover:opacity-100"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="swiss-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="swiss-label text-[#16A34A]">Beschreibung</h3>
          <button type="button" disabled={aiBusy} data-testid="vf-ai-btn" onClick={generateAI} className="swiss-btn-primary text-sm py-2 px-4">
            {aiBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} {aiBusy ? "Generiere…" : "KI-Beschreibung generieren"}
          </button>
        </div>
        <textarea required data-testid="vf-description" value={form.description} onChange={e=>upd("description", e.target.value)} rows={10} className="w-full border border-gray-200 p-4 outline-none focus:border-[#16A34A] text-sm leading-relaxed" placeholder="Beschreibung deines Fahrzeugs…" />
      </div>

      {error && <div data-testid="vf-error" className="text-sm text-red-600 bg-red-50 border border-red-200 p-3">{error}</div>}

      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={() => nav("/dashboard")} className="swiss-btn-secondary">Abbrechen</button>
        <button type="submit" disabled={loading} data-testid="vf-submit" className="swiss-btn-primary">
          {loading ? "Speichern…" : (id ? "Speichern" : "Inserat veröffentlichen")}
        </button>
      </div>
    </form>
  );
}

const inp = "w-full mt-2 border border-gray-200 py-2.5 px-3 outline-none focus:border-[#16A34A] text-sm";
function F({ label, children }) {
  return <div><label className="swiss-label">{label}</label>{children}</div>;
}
