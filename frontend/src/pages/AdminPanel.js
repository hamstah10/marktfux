import React, { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Ban, Power } from "lucide-react";

export default function AdminPanel() {
  const [tab, setTab] = useState("dealers");
  const [stats, setStats] = useState(null);
  const [dealers, setDealers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [filter, setFilter] = useState("");

  const loadStats = () => api.get("/admin/stats").then(r => setStats(r.data)).catch(() => {});
  const loadDealers = () => api.get("/admin/dealers").then(r => setDealers(r.data.items || [])).catch(() => {});
  const loadVehicles = () => api.get("/admin/vehicles").then(r => setVehicles(r.data.items || [])).catch(() => {});

  useEffect(() => { loadStats(); loadDealers(); loadVehicles(); }, []);

  const setDealerStatus = async (id, status) => {
    try {
      await api.patch(`/admin/dealers/${id}/status`, { status });
      toast.success("Status aktualisiert");
      loadDealers(); loadStats();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };
  const setVehicleStatus = async (id, status) => {
    try {
      await api.patch(`/admin/vehicles/${id}/status`, { status });
      toast.success("Inserat aktualisiert");
      loadVehicles(); loadStats();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  const dealerList = filter === "" ? dealers : dealers.filter(d => d.status === filter);

  return (
    <div className="container-x py-10">
      <div className="swiss-label text-[#E63946]">Admin-Panel</div>
      <h1 className="font-display text-3xl font-bold tracking-tight mt-2">Plattform-Verwaltung</h1>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <Stat label="Händler gesamt" value={stats.dealers_total} />
          <Stat label="Wartend" value={stats.dealers_pending} accent={stats.dealers_pending > 0} />
          <Stat label="Inserate" value={stats.vehicles_total} />
          <Stat label="Anfragen" value={stats.inquiries_total} />
        </div>
      )}

      <div className="border-b border-gray-200 mt-12">
        <div className="flex gap-1">
          {[
            { v: "dealers", l: `Händler (${dealers.length})` },
            { v: "vehicles", l: `Inserate (${vehicles.length})` },
          ].map(t => (
            <button key={t.v} data-testid={`admin-tab-${t.v}`} onClick={() => setTab(t.v)} className={`px-5 py-3 text-sm font-semibold border-b-2 -mb-px ${tab === t.v ? "border-[#E63946] text-[#0A0A0A]" : "border-transparent text-gray-500"}`}>
              {t.l}
            </button>
          ))}
        </div>
      </div>

      {tab === "dealers" && (
        <div className="mt-8">
          <div className="flex gap-2 mb-4">
            {["", "pending", "approved", "rejected", "suspended"].map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`text-xs px-3 py-1.5 border ${filter === s ? "bg-[#0A0A0A] text-white border-[#0A0A0A]" : "border-gray-300 text-gray-700"}`}>
                {s === "" ? "Alle" : s}
              </button>
            ))}
          </div>
          <div className="swiss-card overflow-hidden">
            <table className="w-full text-sm" data-testid="admin-dealers-table">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left swiss-label p-4">Händler</th>
                  <th className="text-left swiss-label p-4">E-Mail</th>
                  <th className="text-left swiss-label p-4">Status</th>
                  <th className="text-right swiss-label p-4">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {dealerList.map(d => (
                  <tr key={d.id} className="border-b border-gray-100">
                    <td className="p-4">
                      <div className="font-semibold">{d.company || d.name}</div>
                      <div className="text-xs text-gray-500">{d.name}</div>
                    </td>
                    <td className="p-4 text-gray-600">{d.email}</td>
                    <td className="p-4"><StatusBadge status={d.status} /></td>
                    <td className="p-4 text-right">
                      <div className="inline-flex gap-1">
                        {d.status !== "approved" && <IconBtn testid={`approve-${d.id}`} onClick={() => setDealerStatus(d.id, "approved")} icon={CheckCircle2} color="text-green-600" title="Freigeben" />}
                        {d.status !== "rejected" && <IconBtn testid={`reject-${d.id}`} onClick={() => setDealerStatus(d.id, "rejected")} icon={XCircle} color="text-red-600" title="Ablehnen" />}
                        {d.status === "approved" && <IconBtn testid={`suspend-${d.id}`} onClick={() => setDealerStatus(d.id, "suspended")} icon={Ban} color="text-orange-600" title="Sperren" />}
                      </div>
                    </td>
                  </tr>
                ))}
                {dealerList.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-500">Keine Händler.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "vehicles" && (
        <div className="mt-8">
          <div className="swiss-card overflow-hidden">
            <table className="w-full text-sm" data-testid="admin-vehicles-table">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left swiss-label p-4">Inserat</th>
                  <th className="text-left swiss-label p-4">Händler</th>
                  <th className="text-left swiss-label p-4">Status</th>
                  <th className="text-right swiss-label p-4">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map(v => (
                  <tr key={v.id} className="border-b border-gray-100">
                    <td className="p-4">
                      <div className="font-semibold">{v.title}</div>
                      <div className="text-xs text-gray-500">{v.brand} {v.model} · {v.year}</div>
                    </td>
                    <td className="p-4 text-gray-600">{v.dealer_name}</td>
                    <td className="p-4"><StatusBadge status={v.status} /></td>
                    <td className="p-4 text-right">
                      <div className="inline-flex gap-1">
                        {v.status !== "published" ? (
                          <IconBtn testid={`publish-${v.id}`} onClick={() => setVehicleStatus(v.id, "published")} icon={Power} color="text-green-600" title="Aktivieren" />
                        ) : (
                          <IconBtn testid={`deactivate-${v.id}`} onClick={() => setVehicleStatus(v.id, "deactivated")} icon={Ban} color="text-orange-600" title="Deaktivieren" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {vehicles.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-500">Keine Inserate.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className={`swiss-card p-5 ${accent ? "border-[#E63946] border-2" : ""}`}>
      <div className="swiss-label text-gray-500">{label}</div>
      <div className={`font-display text-3xl font-extrabold mt-2 ${accent ? "text-[#E63946]" : ""}`}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    approved: "bg-green-50 text-green-700 border-green-200",
    published: "bg-green-50 text-green-700 border-green-200",
    pending: "bg-yellow-50 text-yellow-800 border-yellow-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
    suspended: "bg-orange-50 text-orange-700 border-orange-200",
    deactivated: "bg-gray-100 text-gray-600 border-gray-200",
    draft: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return <span className={`text-xs font-bold px-2 py-1 border ${colors[status] || ""}`}>{status}</span>;
}

function IconBtn({ icon: Icon, color, title, onClick, testid }) {
  return (
    <button data-testid={testid} title={title} onClick={onClick} className={`p-2 hover:bg-gray-100 ${color}`}>
      <Icon className="w-4 h-4" />
    </button>
  );
}
