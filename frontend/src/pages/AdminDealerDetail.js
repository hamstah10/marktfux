import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { api, imgUrl, formatApiError } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Mail, Phone, Calendar, ExternalLink, Star, CheckCircle2, XCircle, Ban, Trash2, Building2, Eye, MessagesSquare, TrendingUp, Layers } from "lucide-react";
import ImagePlaceholder from "@/components/ImagePlaceholder";

const fmtPrice = (n) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

const STATUS_BADGE = {
  approved: "bg-green-50 text-green-700 border-green-200",
  pending: "bg-yellow-50 text-yellow-800 border-yellow-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  suspended: "bg-orange-50 text-orange-700 border-orange-200",
  published: "bg-green-50 text-green-700 border-green-200",
  deactivated: "bg-gray-100 text-gray-600 border-gray-200",
  draft: "bg-gray-100 text-gray-600 border-gray-200",
};

function StatusBadge({ status }) {
  return <span className={`text-xs font-bold px-2 py-1 border ${STATUS_BADGE[status] || ""}`}>{status}</span>;
}

export default function AdminDealerDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);

  const load = () => api.get(`/admin/dealers/${id}`).then(r => setData(r.data)).catch(() => setData(false));
  useEffect(() => { load(); }, [id]);

  const setStatus = async (status) => {
    try {
      await api.patch(`/admin/dealers/${id}/status`, { status });
      toast.success("Status aktualisiert");
      load();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  const setVehicleStatus = async (vid, status) => {
    try {
      await api.patch(`/admin/vehicles/${vid}/status`, { status });
      toast.success("Inserat aktualisiert");
      load();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  const deleteReview = async (rid) => {
    if (!window.confirm("Diese Bewertung wirklich löschen?")) return;
    try {
      await api.delete(`/admin/reviews/${rid}`);
      toast.success("Bewertung gelöscht");
      load();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  if (data === false) return <div className="page-wrap py-20 text-center text-gray-500">Händler nicht gefunden.</div>;
  if (!data) return <div className="page-wrap py-20 text-center text-gray-500">Lade…</div>;

  const { dealer, stats, vehicles, reviews } = data;

  return (
    <div className="page-wrap py-10">
      <button onClick={() => nav("/admin")} data-testid="back-to-admin" className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-[#16A34A] mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Admin-Übersicht
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-6 mb-10">
        <div>
          <div className="swiss-label text-[#16A34A]">Händler-Detail</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-2" data-testid="admin-dealer-name">
            {dealer.company || dealer.name}
          </h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-sm text-gray-600">
            <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-[#16A34A]" /> {dealer.name}</span>
            <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-[#16A34A]" /> {dealer.email}</span>
            {dealer.phone && <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-[#16A34A]" /> {dealer.phone}</span>}
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-[#16A34A]" /> {new Date(dealer.created_at).toLocaleDateString("de-DE")}</span>
            <StatusBadge status={dealer.status} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {dealer.status === "approved" && (
            <Link to={`/haendler/${dealer.id}`} target="_blank" className="swiss-btn-secondary text-sm py-2 px-4">
              <ExternalLink className="w-4 h-4" /> Öffentliches Profil
            </Link>
          )}
          {dealer.status !== "approved" && (
            <button onClick={() => setStatus("approved")} data-testid="dd-approve" className="inline-flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-4 py-2 hover:bg-green-700"><CheckCircle2 className="w-4 h-4" /> Freigeben</button>
          )}
          {dealer.status !== "rejected" && dealer.status !== "approved" && (
            <button onClick={() => setStatus("rejected")} data-testid="dd-reject" className="inline-flex items-center gap-2 bg-red-600 text-white text-sm font-semibold px-4 py-2 hover:bg-red-700"><XCircle className="w-4 h-4" /> Ablehnen</button>
          )}
          {dealer.status === "approved" && (
            <button onClick={() => setStatus("suspended")} data-testid="dd-suspend" className="inline-flex items-center gap-2 bg-orange-600 text-white text-sm font-semibold px-4 py-2 hover:bg-orange-700"><Ban className="w-4 h-4" /> Sperren</button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi icon={Layers} label="Inserate" value={stats.vehicles_total} />
        <Kpi icon={Eye} label="Views gesamt" value={stats.total_views} />
        <Kpi icon={MessagesSquare} label="Anfragen" value={stats.inquiries_total} highlight={stats.inquiries_unread > 0} sub={stats.inquiries_unread > 0 ? `${stats.inquiries_unread} ungelesen` : null} />
        <Kpi icon={TrendingUp} label="Bewertung" value={stats.rating_count > 0 ? `${stats.rating_avg.toFixed(1)} ★` : "—"} sub={`${stats.rating_count} Reviews`} accent />
      </div>

      {/* Vehicles */}
      <div className="mt-10">
        <h2 className="font-display text-2xl font-bold mb-5">Inserate ({vehicles.length})</h2>
        {vehicles.length === 0 ? (
          <div className="swiss-card p-8 text-center text-gray-500 text-sm">Noch keine Inserate.</div>
        ) : (
          <div className="swiss-card overflow-hidden">
            <table className="w-full text-sm" data-testid="dd-vehicles-table">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left swiss-label p-4">Fahrzeug</th>
                  <th className="text-left swiss-label p-4">Preis</th>
                  <th className="text-left swiss-label p-4">Views</th>
                  <th className="text-left swiss-label p-4">Status</th>
                  <th className="text-right swiss-label p-4">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map(v => (
                  <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4">
                      <Link to={`/admin/fahrzeug/${v.id}`} className="flex items-center gap-3 group">
                        <div className="w-14 h-10 bg-gray-100 overflow-hidden flex-shrink-0">
                          {v.images?.[0] ? <img src={imgUrl(v.images[0])} alt="" className="w-full h-full object-cover" /> : <ImagePlaceholder size="sm" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold group-hover:text-[#16A34A] transition-colors truncate">{v.title}</div>
                          <div className="text-xs text-gray-500">{v.brand} {v.model} · {v.year}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="p-4 font-semibold">{fmtPrice(v.price)}</td>
                    <td className="p-4 font-mono">{v.views || 0}</td>
                    <td className="p-4"><StatusBadge status={v.status} /></td>
                    <td className="p-4 text-right">
                      {v.status === "published" ? (
                        <button onClick={() => setVehicleStatus(v.id, "deactivated")} data-testid={`dd-v-deactivate-${v.id}`} className="text-xs text-orange-600 hover:underline">Deaktivieren</button>
                      ) : (
                        <button onClick={() => setVehicleStatus(v.id, "published")} data-testid={`dd-v-activate-${v.id}`} className="text-xs text-green-600 hover:underline">Aktivieren</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reviews */}
      <div className="mt-10">
        <h2 className="font-display text-2xl font-bold mb-5">Bewertungen ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <div className="swiss-card p-8 text-center text-gray-500 text-sm">Noch keine Bewertungen.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4" data-testid="dd-reviews">
            {reviews.map(r => (
              <div key={r.id} className="swiss-card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`w-4 h-4 ${i <= r.rating ? "fill-[#16A34A] text-[#16A34A]" : "text-gray-300"}`} />
                      ))}
                    </div>
                    <div className="font-semibold mt-2">{r.name}</div>
                  </div>
                  <button onClick={() => deleteReview(r.id)} data-testid={`dd-r-delete-${r.id}`} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50" title="Löschen">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap leading-relaxed">{r.comment}</p>
                <div className="text-xs text-gray-400 mt-3">{new Date(r.created_at).toLocaleString("de-DE")}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub, highlight, accent }) {
  return (
    <div className={`swiss-card p-5 ${highlight ? "border-[#16A34A] border-2" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="swiss-label text-gray-500">{label}</div>
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div className={`font-display text-3xl font-extrabold mt-3 ${accent ? "text-[#16A34A]" : ""}`}>{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}
