import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, imgUrl, formatApiError } from "@/lib/api";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";
import { Calendar, Gauge, Fuel, Settings, Zap, MapPin, ArrowLeft, Phone, Building2, Heart } from "lucide-react";
import ImagePlaceholder from "@/components/ImagePlaceholder";

const fmtPrice = (n) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
const fmtKm = (n) => new Intl.NumberFormat("de-DE").format(n || 0) + " km";

export default function CarDetail() {
  const { id } = useParams();
  const { isFav, toggle } = useFavorites();
  const [v, setV] = useState(null);
  const [active, setActive] = useState(0);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    api.get(`/vehicles/${id}`).then(r => {
      setV(r.data);
      setForm(f => ({ ...f, message: `Guten Tag,\n\nich interessiere mich für Ihr Fahrzeug "${r.data.title}".\nIst dieses noch verfügbar?\n\nMit freundlichen Grüßen` }));
    }).catch(() => setV(false));
  }, [id]);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post(`/vehicles/${id}/inquiries`, form);
      setSent(true);
      toast.success("Anfrage gesendet!");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Fehler beim Senden");
    } finally {
      setSending(false);
    }
  };

  if (v === false) return <div className="page-wrap py-20 text-center text-gray-500" data-testid="vehicle-not-found">Fahrzeug nicht gefunden.</div>;
  if (!v) return <div className="page-wrap py-20 text-center text-gray-500">Lade…</div>;

  const images = v.images?.length ? v.images : [];

  return (
    <div className="page-wrap py-8">
      <Link to="/fahrzeuge" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#16A34A] mb-6">
        <ArrowLeft className="w-4 h-4" /> Zurück zur Übersicht
      </Link>

      <div className="grid lg:grid-cols-[1fr_400px] gap-10">
        {/* Left — gallery + details */}
        <div>
          <div className="aspect-[16/10] bg-gray-100 overflow-hidden relative">
            {images[active] ? (
              <img src={imgUrl(images[active])} alt={v.title} className="w-full h-full object-cover" data-testid="vehicle-main-image" />
            ) : (
              <ImagePlaceholder />
            )}
            <button
              onClick={() => toggle(v.id)}
              data-testid="detail-fav-btn"
              aria-label={isFav(v.id) ? "Aus Merkliste entfernen" : "Zur Merkliste hinzufügen"}
              className={`absolute top-4 right-4 inline-flex items-center gap-2 px-4 h-11 text-sm font-semibold transition-all ${isFav(v.id) ? "bg-[#16A34A] text-white" : "bg-white/95 text-gray-800 hover:bg-white"}`}
            >
              <Heart className="w-4 h-4" fill={isFav(v.id) ? "currentColor" : "none"} />
              {isFav(v.id) ? "Gemerkt" : "Merken"}
            </button>
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-6 gap-2 mt-2">
              {images.map((p, i) => (
                <button key={i} onClick={() => setActive(i)} className={`aspect-[4/3] overflow-hidden border-2 ${active === i ? "border-[#16A34A]" : "border-transparent"}`}>
                  <img src={imgUrl(p)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="mt-10">
            <div className="swiss-label text-[#16A34A]">{v.brand} · {v.year}</div>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-2">{v.title}</h1>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5 mt-8 swiss-card p-6">
              <Spec icon={Calendar} label="Erstzulassung" val={v.year} />
              <Spec icon={Gauge} label="Kilometerstand" val={fmtKm(v.mileage)} />
              <Spec icon={Fuel} label="Kraftstoff" val={v.fuel} />
              <Spec icon={Settings} label="Getriebe" val={v.transmission} />
              <Spec icon={Zap} label="Leistung" val={`${v.power_hp} PS`} />
              <Spec icon={MapPin} label="Standort" val={v.location || "—"} />
            </div>

            <div className="mt-10">
              <h2 className="font-display text-2xl font-bold tracking-tight">Beschreibung</h2>
              <div className="prose prose-sm max-w-none mt-4 text-gray-700 whitespace-pre-wrap leading-relaxed">{v.description}</div>
            </div>
          </div>
        </div>

        {/* Right — sticky sidebar */}
        <aside>
          <div className="md:sticky md:top-6">
            <div className="swiss-card p-6">
              <div className="text-4xl font-display font-extrabold">{fmtPrice(v.price)}</div>
              <p className="text-xs text-gray-500 mt-1">inkl. MwSt. ausweisbar (sofern zutreffend)</p>
            </div>

            {v.dealer && (
              <Link to={`/haendler/${v.dealer.id}`} data-testid="vehicle-dealer-link" className="swiss-card p-6 mt-3 block hover:border-[#16A34A] transition-colors group">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="swiss-label text-gray-500">Händler</div>
                    <div className="font-semibold text-base mt-2 flex items-center gap-2"><Building2 className="w-4 h-4 text-[#16A34A]" /> {v.dealer.company || v.dealer.name}</div>
                    {v.dealer.phone && <div className="text-sm text-gray-600 mt-1 flex items-center gap-2"><Phone className="w-4 h-4" /> {v.dealer.phone}</div>}
                    <div className="text-sm text-gray-500 mt-1">{v.location}</div>
                  </div>
                  <span className="swiss-label text-gray-400 group-hover:text-[#16A34A] transition-colors">Profil →</span>
                </div>
              </Link>
            )}

            <div className="swiss-card p-6 mt-3">
              <h3 className="font-display font-bold text-lg">Anfrage senden</h3>
              <p className="text-sm text-gray-500 mb-5">Direkt an den Händler — kostenfrei.</p>
              {sent ? (
                <div data-testid="inquiry-success" className="bg-green-50 border border-green-200 p-4 text-sm text-green-800">
                  Vielen Dank! Deine Anfrage wurde gesendet.
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-3">
                  <input required data-testid="inquiry-name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Dein Name *" className="w-full border border-gray-200 py-2.5 px-3 text-sm focus:border-[#16A34A] outline-none" />
                  <input required type="email" data-testid="inquiry-email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="E-Mail *" className="w-full border border-gray-200 py-2.5 px-3 text-sm focus:border-[#16A34A] outline-none" />
                  <input data-testid="inquiry-phone" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="Telefon (optional)" className="w-full border border-gray-200 py-2.5 px-3 text-sm focus:border-[#16A34A] outline-none" />
                  <textarea required data-testid="inquiry-message" value={form.message} onChange={(e) => setForm({...form, message: e.target.value})} rows={5} className="w-full border border-gray-200 py-2.5 px-3 text-sm focus:border-[#16A34A] outline-none" />
                  <button data-testid="inquiry-submit" disabled={sending} className="swiss-btn-primary w-full">{sending ? "Senden…" : "Anfrage abschicken"}</button>
                </form>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Spec({ icon: Icon, label, val }) {
  return (
    <div>
      <div className="swiss-label text-gray-400 flex items-center gap-1.5 mb-1"><Icon className="w-3.5 h-3.5" /> {label}</div>
      <div className="font-semibold text-sm">{val}</div>
    </div>
  );
}
