import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, imgUrl } from "@/lib/api";
import { useCompare } from "@/hooks/useCompare";
import { X, GitCompareArrows, ArrowLeft, Mail } from "lucide-react";
import ImagePlaceholder from "@/components/ImagePlaceholder";

const fmtPrice = (n) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
const fmtKm = (n) => new Intl.NumberFormat("de-DE").format(n || 0) + " km";

const ROWS = [
  { k: "price", l: "Preis", fmt: fmtPrice },
  { k: "year", l: "Baujahr" },
  { k: "mileage", l: "Kilometer", fmt: fmtKm },
  { k: "fuel", l: "Kraftstoff" },
  { k: "transmission", l: "Getriebe" },
  { k: "power_hp", l: "Leistung", fmt: (n) => `${n} PS` },
  { k: "location", l: "Standort" },
];

export default function Compare() {
  const { items, remove, clear } = useCompare();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (items.length === 0) { setVehicles([]); setLoading(false); return; }
    setLoading(true);
    api.post("/vehicles/by-ids", { ids: items }).then((r) => {
      const map = new Map(r.data.items.map((v) => [v.id, v]));
      setVehicles(items.map((id) => map.get(id)).filter(Boolean));
    }).finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [items.join(",")]);

  // Highlight best/worst per row (price/mileage = lower better, year/power = higher better)
  const lowerBetter = new Set(["price", "mileage"]);
  const higherBetter = new Set(["year", "power_hp"]);

  const winner = (key) => {
    if (vehicles.length < 2) return null;
    const vals = vehicles.map((v) => v?.[key]).filter((x) => typeof x === "number");
    if (vals.length < 2) return null;
    if (lowerBetter.has(key)) return Math.min(...vals);
    if (higherBetter.has(key)) return Math.max(...vals);
    return null;
  };

  return (
    <div className="page-wrap py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <Link to="/fahrzeuge" className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-[#16A34A] mb-3">
            <ArrowLeft className="w-3.5 h-3.5" /> Zurück
          </Link>
          <div className="swiss-label text-[#16A34A] flex items-center gap-2"><GitCompareArrows className="w-3.5 h-3.5" /> Vergleich</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-2">
            Side-by-Side <em className="font-serif italic font-normal text-[#16A34A]">Vergleich</em>
          </h1>
          <p className="text-sm text-gray-500 mt-2">Bis zu 3 Fahrzeuge gleichzeitig — beste Werte sind rot markiert.</p>
        </div>
        {vehicles.length > 0 && (
          <button onClick={clear} data-testid="compare-clear" className="swiss-btn-secondary text-sm py-2 px-4">Alle entfernen</button>
        )}
      </div>

      {loading ? (
        <div className="text-gray-500">Lade…</div>
      ) : vehicles.length === 0 ? (
        <div className="swiss-card p-12 text-center" data-testid="empty-compare">
          <GitCompareArrows className="w-10 h-10 mx-auto text-gray-300" />
          <h3 className="font-display text-xl font-bold mt-4">Noch nichts ausgewählt</h3>
          <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">Klicke auf das Vergleich-Symbol bei einem Inserat, um es hier zu sehen. Maximal 3 Fahrzeuge.</p>
          <Link to="/fahrzeuge" className="swiss-btn-primary mt-6 inline-flex">Fahrzeuge durchsuchen</Link>
        </div>
      ) : (
        <div className="overflow-x-auto" data-testid="compare-table">
          <table className="w-full text-sm border border-gray-200 min-w-[700px]">
            {/* Header row */}
            <thead>
              <tr>
                <th className="bg-gray-50 border-r border-gray-200 p-4 w-40 swiss-label text-gray-500 text-left align-bottom">Fahrzeug</th>
                {vehicles.map((v) => (
                  <th key={v.id} className="border-r border-gray-200 p-4 text-left align-top" style={{ width: `${(100 - 18) / vehicles.length}%` }}>
                    <div className="relative">
                      <button onClick={() => remove(v.id)} data-testid={`compare-remove-${v.id}`} className="absolute -top-1 right-0 p-1 hover:bg-gray-100"><X className="w-4 h-4" /></button>
                      <Link to={`/fahrzeuge/${v.id}`} className="block">
                        <div className="aspect-[4/3] bg-gray-100 overflow-hidden mb-3 max-w-[200px]">
                          {v.images?.[0] ? <img src={imgUrl(v.images[0])} alt="" className="w-full h-full object-cover" /> : <ImagePlaceholder size="sm" />}
                        </div>
                        <div className="swiss-label text-gray-400">{v.brand}</div>
                        <div className="font-display font-bold text-base mt-1 leading-tight">{v.title}</div>
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, idx) => {
                const w = winner(row.k);
                return (
                  <tr key={row.k} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="border-r border-gray-200 p-4 swiss-label text-gray-500">{row.l}</td>
                    {vehicles.map((v) => {
                      const val = v?.[row.k];
                      const isW = w !== null && val === w;
                      return (
                        <td key={v.id + row.k} className={`border-r border-gray-200 p-4 font-semibold ${isW ? "text-[#16A34A]" : "text-gray-900"}`}>
                          {val != null && val !== "" ? (row.fmt ? row.fmt(val) : val) : "—"}
                          {isW && <span className="ml-2 text-[10px] uppercase tracking-widest font-bold text-[#16A34A]">Best</span>}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {/* CTA row */}
              <tr>
                <td className="border-r border-gray-200 p-4 swiss-label text-gray-500">Aktion</td>
                {vehicles.map((v) => (
                  <td key={v.id + "cta"} className="border-r border-gray-200 p-4">
                    <Link to={`/fahrzeuge/${v.id}`} className="swiss-btn-primary text-xs py-2 px-3 w-full"><Mail className="w-3.5 h-3.5" /> Anfragen</Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
