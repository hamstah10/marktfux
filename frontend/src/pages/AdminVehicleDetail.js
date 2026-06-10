import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { api, imgUrl, formatApiError } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Mail, Phone, MapPin, Calendar, Gauge, Fuel, Settings, Zap, Eye, MessagesSquare, Power, Ban, Building2, User } from "lucide-react";
import ImagePlaceholder from "@/components/ImagePlaceholder";

const fmtPrice = (n) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
const fmtKm = (n) => new Intl.NumberFormat("de-DE").format(n || 0) + " km";

const STATUS_BADGE = {
  published: "bg-green-50 text-green-700 border-green-200",
  deactivated: "bg-gray-100 text-gray-600 border-gray-200",
  draft: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function AdminVehicleDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [active, setActive] = useState(0);

  const load = () => api.get(`/admin/vehicles/${id}`).then(r => setData(r.data)).catch(() => setData(false));
  useEffect(() => { load(); }, [id]);

  const setStatus = async (status) => {
    try {
      await api.patch(`/admin/vehicles/${id}/status`, { status });
      toast.success("Status aktualisiert");
      load();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  if (data === false) return <div className="container-x py-20 text-center text-gray-500">Fahrzeug nicht gefunden.</div>;
  if (!data) return <div className="container-x py-20 text-center text-gray-500">Lade…</div>;

  const { vehicle: v, dealer, inquiries } = data;
  const images = v.images || [];

  return (
    <div className="container-x py-10">
      <button onClick={() => nav("/admin")} data-testid="back-to-admin" className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-[#16A34A] mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Admin-Übersicht
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="swiss-label text-[#16A34A]">Inserats-Detail</span>
            <span className={`text-xs font-bold px-2 py-1 border ${STATUS_BADGE[v.status] || ""}`}>{v.status}</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight" data-testid="admin-vehicle-title">
            {v.title}
          </h1>
          <div className="text-sm text-gray-500 mt-2">
            {v.brand} {v.model} · {v.year} · ID <span className="font-mono">{v.id.slice(0, 8)}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {v.status === "published" && (
            <Link to={`/fahrzeuge/${v.id}`} target="_blank" className="swiss-btn-secondary text-sm py-2 px-4">
              <ExternalLink className="w-4 h-4" /> Öffentliche Ansicht
            </Link>
          )}
          {v.status === "published" ? (
            <button onClick={() => setStatus("deactivated")} data-testid="vd-deactivate" className="inline-flex items-center gap-2 bg-orange-600 text-white text-sm font-semibold px-4 py-2 hover:bg-orange-700"><Ban className="w-4 h-4" /> Deaktivieren</button>
          ) : (
            <button onClick={() => setStatus("published")} data-testid="vd-activate" className="inline-flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-4 py-2 hover:bg-green-700"><Power className="w-4 h-4" /> Aktivieren</button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-10">
        <div>
          {/* Gallery */}
          <div className="aspect-[16/10] bg-gray-100 overflow-hidden">
            {images[active] ? (
              <img src={imgUrl(images[active])} alt="" className="w-full h-full object-cover" />
            ) : <ImagePlaceholder />}
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

          {/* Specs */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5 mt-8 swiss-card p-6">
            <Spec icon={Calendar} label="Baujahr" val={v.year} />
            <Spec icon={Gauge} label="Kilometerstand" val={fmtKm(v.mileage)} />
            <Spec icon={Fuel} label="Kraftstoff" val={v.fuel} />
            <Spec icon={Settings} label="Getriebe" val={v.transmission} />
            <Spec icon={Zap} label="Leistung" val={`${v.power_hp} PS`} />
            <Spec icon={MapPin} label="Standort" val={v.location || "—"} />
          </div>

          {/* Description */}
          <div className="mt-8">
            <div className="swiss-label text-gray-500 mb-3">Beschreibung</div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-5 border border-gray-200">{v.description}</div>
          </div>

          {/* Inquiries */}
          <div className="mt-10">
            <h2 className="font-display text-2xl font-bold mb-5 flex items-center gap-2">
              <MessagesSquare className="w-5 h-5 text-[#16A34A]" /> Anfragen ({inquiries.length})
            </h2>
            {inquiries.length === 0 ? (
              <div className="swiss-card p-6 text-sm text-gray-500 text-center">Noch keine Anfragen.</div>
            ) : (
              <div className="space-y-3" data-testid="vd-inquiries">
                {inquiries.map(i => (
                  <div key={i.id} className="swiss-card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold">{i.name}</div>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {i.email}</span>
                          {i.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {i.phone}</span>}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 flex flex-col items-end gap-1">
                        <span>{new Date(i.created_at).toLocaleString("de-DE")}</span>
                        {!i.read && <span className="text-[10px] font-bold uppercase tracking-widest text-[#16A34A]">Neu</span>}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap mt-3 leading-relaxed">{i.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="swiss-card p-6">
            <div className="swiss-label text-gray-500">Preis</div>
            <div className="font-display text-4xl font-extrabold mt-2">{fmtPrice(v.price)}</div>
          </div>

          <div className="swiss-card p-6">
            <div className="swiss-label text-gray-500">Performance</div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <div className="text-xs text-gray-500 flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Views</div>
                <div className="font-display text-2xl font-extrabold mt-1">{v.views || 0}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 flex items-center gap-1"><MessagesSquare className="w-3.5 h-3.5" /> Leads</div>
                <div className="font-display text-2xl font-extrabold mt-1">{inquiries.length}</div>
              </div>
            </div>
          </div>

          {dealer && (
            <Link to={`/admin/haendler/${dealer.id}`} data-testid="vd-dealer-link" className="swiss-card p-6 block hover:border-[#16A34A] transition-colors group">
              <div className="swiss-label text-gray-500">Händler</div>
              <div className="flex items-start justify-between gap-3 mt-3">
                <div className="min-w-0">
                  <div className="font-display font-bold text-lg flex items-center gap-2"><Building2 className="w-4 h-4 text-[#16A34A]" /> {dealer.company || dealer.name}</div>
                  {dealer.company && <div className="text-xs text-gray-500 flex items-center gap-1 mt-1"><User className="w-3 h-3" /> {dealer.name}</div>}
                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-1"><Mail className="w-3 h-3" /> {dealer.email}</div>
                  {dealer.phone && <div className="text-xs text-gray-500 flex items-center gap-1 mt-1"><Phone className="w-3 h-3" /> {dealer.phone}</div>}
                </div>
                <span className="swiss-label text-gray-400 group-hover:text-[#16A34A] transition-colors">Profil →</span>
              </div>
              <div className="mt-3 text-xs">
                <span className={`text-xs font-bold px-2 py-0.5 border ${dealer.status === "approved" ? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-800 border-yellow-200"}`}>{dealer.status}</span>
              </div>
            </Link>
          )}

          <div className="swiss-card p-6">
            <div className="swiss-label text-gray-500">Meta</div>
            <dl className="mt-3 text-xs text-gray-600 space-y-2">
              <div><dt className="text-gray-400">Erstellt</dt><dd>{new Date(v.created_at).toLocaleString("de-DE")}</dd></div>
              {v.updated_at && <div><dt className="text-gray-400">Aktualisiert</dt><dd>{new Date(v.updated_at).toLocaleString("de-DE")}</dd></div>}
            </dl>
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
