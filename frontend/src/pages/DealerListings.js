import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, imgUrl, formatApiError } from "@/lib/api";
import { Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

const fmtPrice = (n) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
const STATUS_BADGE = {
  published: "bg-green-50 text-green-700 border-green-200",
  deactivated: "bg-gray-100 text-gray-600 border-gray-200",
  draft: "bg-yellow-50 text-yellow-800 border-yellow-200",
};

export default function DealerListings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    setLoading(true);
    api.get("/dealer/vehicles").then(r => setItems(r.data.items || [])).finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  const onDelete = async (v) => {
    if (!window.confirm(`Inserat "${v.title}" wirklich löschen?`)) return;
    try {
      await api.delete(`/dealer/vehicles/${v.id}`);
      toast.success("Gelöscht");
      reload();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  if (loading) return <div className="text-gray-500">Lade…</div>;
  if (items.length === 0) {
    return (
      <div className="swiss-card p-10 text-center" data-testid="empty-listings">
        <h3 className="font-display text-xl font-bold">Noch keine Inserate</h3>
        <p className="text-gray-500 text-sm mt-2">Lege dein erstes Fahrzeug an — in unter 2 Minuten online.</p>
        <Link to="/dashboard/neu" className="swiss-btn-primary mt-6 inline-flex">Neues Fahrzeug</Link>
      </div>
    );
  }

  return (
    <div className="swiss-card overflow-hidden" data-testid="dealer-listings-table">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left swiss-label p-4">Fahrzeug</th>
            <th className="text-left swiss-label p-4 hidden md:table-cell">Daten</th>
            <th className="text-left swiss-label p-4">Preis</th>
            <th className="text-left swiss-label p-4">Status</th>
            <th className="text-right swiss-label p-4">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {items.map(v => (
            <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-12 bg-gray-100 overflow-hidden flex-shrink-0">
                    {v.images?.[0] && <img src={imgUrl(v.images[0])} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <div className="font-semibold">{v.title}</div>
                    <div className="text-xs text-gray-500">{v.brand} {v.model}</div>
                  </div>
                </div>
              </td>
              <td className="p-4 text-gray-600 hidden md:table-cell">
                {v.year} · {new Intl.NumberFormat("de-DE").format(v.mileage)} km · {v.fuel}
              </td>
              <td className="p-4 font-semibold">{fmtPrice(v.price)}</td>
              <td className="p-4">
                <span className={`text-xs font-bold px-2 py-1 border ${STATUS_BADGE[v.status] || ""}`}>{v.status}</span>
              </td>
              <td className="p-4 text-right">
                <div className="inline-flex items-center gap-1">
                  <Link to={`/fahrzeuge/${v.id}`} title="Ansehen" className="p-2 hover:bg-gray-100"><Eye className="w-4 h-4" /></Link>
                  <Link to={`/dashboard/bearbeiten/${v.id}`} data-testid={`edit-${v.id}`} title="Bearbeiten" className="p-2 hover:bg-gray-100"><Pencil className="w-4 h-4" /></Link>
                  <button onClick={() => onDelete(v)} data-testid={`delete-${v.id}`} title="Löschen" className="p-2 hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
