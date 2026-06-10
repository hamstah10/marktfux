import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, imgUrl } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Eye, MessagesSquare, TrendingUp, Layers } from "lucide-react";
import ImagePlaceholder from "@/components/ImagePlaceholder";

export default function DealerStats() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("views");

  useEffect(() => {
    api.get("/dealer/analytics").then(r => setData(r.data)).catch(() => setData({ per_vehicle: [], top_views: [], top_leads: [], total_views: 0, total_leads: 0, overall_conversion: 0, active_listings: 0 }));
  }, []);

  if (!data) return <div className="text-gray-500">Lade Analytics…</div>;

  const chartData = (tab === "views" ? data.top_views : data.top_leads).map(v => ({
    name: (v.title || "").length > 18 ? v.title.slice(0, 18) + "…" : v.title,
    views: v.views,
    leads: v.leads,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight">Analytics</h2>
        <p className="text-gray-500 text-sm mt-1">Views, Leads und Conversion deiner Inserate auf einen Blick.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi icon={Eye} label="Views gesamt" value={data.total_views} />
        <Kpi icon={MessagesSquare} label="Leads gesamt" value={data.total_leads} />
        <Kpi icon={TrendingUp} label="Conversion" value={`${data.overall_conversion}%`} accent />
        <Kpi icon={Layers} label="Aktive Inserate" value={data.active_listings} />
      </div>

      {/* Chart */}
      <div className="swiss-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-lg font-bold">Top-Performer</h3>
          <div className="flex border border-gray-200">
            {[{ v: "views", l: "Views" }, { v: "leads", l: "Leads" }].map(t => (
              <button key={t.v} data-testid={`tab-${t.v}`} onClick={() => setTab(t.v)} className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${tab === t.v ? "bg-[#0A0A0A] text-white" : "text-gray-600 hover:bg-gray-50"}`}>
                {t.l}
              </button>
            ))}
          </div>
        </div>
        {chartData.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Noch keine Daten — sobald Käufer deine Inserate anschauen, erscheinen hier Statistiken.</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} tickLine={false} axisLine={{ stroke: "#E5E7EB" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} tickLine={false} axisLine={{ stroke: "#E5E7EB" }} allowDecimals={false} />
              <Tooltip cursor={{ fill: "#F9FAFB" }} contentStyle={{ border: "1px solid #E5E7EB", borderRadius: 0, fontSize: 12 }} />
              <Bar dataKey={tab} fill="#16A34A" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Per-Vehicle table */}
      <div className="swiss-card overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-display text-lg font-bold">Pro Inserat</h3>
        </div>
        <table className="w-full text-sm" data-testid="analytics-table">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left swiss-label p-4">Fahrzeug</th>
              <th className="text-right swiss-label p-4">Views</th>
              <th className="text-right swiss-label p-4">Leads</th>
              <th className="text-right swiss-label p-4">Conversion</th>
            </tr>
          </thead>
          <tbody>
            {data.per_vehicle.length === 0 ? (
              <tr><td colSpan={4} className="p-10 text-center text-gray-400">Noch keine Inserate. <Link to="/dashboard/neu" className="text-[#16A34A] font-semibold ml-1">Jetzt anlegen</Link>.</td></tr>
            ) : data.per_vehicle.map(v => (
              <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4">
                  <Link to={`/fahrzeuge/${v.id}`} className="flex items-center gap-3">
                    <div className="w-12 h-9 bg-gray-100 overflow-hidden flex-shrink-0">
                      {v.image ? <img src={imgUrl(v.image)} alt="" className="w-full h-full object-cover" /> : <ImagePlaceholder size="sm" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{v.title}</div>
                      <div className="text-xs text-gray-500">{v.brand} {v.model} · <span className="capitalize">{v.status}</span></div>
                    </div>
                  </Link>
                </td>
                <td className="p-4 text-right font-mono font-semibold">{v.views}</td>
                <td className="p-4 text-right font-mono font-semibold">{v.leads}</td>
                <td className="p-4 text-right font-mono font-semibold">{v.conversion}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, accent }) {
  return (
    <div className={`swiss-card p-5 ${accent ? "border-[#16A34A] border-2" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="swiss-label text-gray-500">{label}</div>
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div className={`font-display text-3xl font-extrabold mt-3 ${accent ? "text-[#16A34A]" : ""}`}>{value}</div>
    </div>
  );
}
