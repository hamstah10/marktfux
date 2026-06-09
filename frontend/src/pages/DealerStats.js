import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function DealerStats() {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.get("/dealer/stats").then(r => setStats(r.data)); }, []);
  if (!stats) return <div className="text-gray-500">Lade…</div>;

  return (
    <div className="space-y-6">
      <div className="swiss-card p-6">
        <h3 className="font-display text-xl font-bold">Übersicht</h3>
        <p className="text-gray-500 text-sm mt-1">Schnellüberblick über deine Aktivität auf der Plattform.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Row label="Inserate gesamt" value={stats.total_listings} />
        <Row label="Veröffentlichte Inserate" value={stats.published_listings} />
        <Row label="Anfragen gesamt" value={stats.total_inquiries} />
        <Row label="Ungelesene Anfragen" value={stats.unread_inquiries} highlight={stats.unread_inquiries > 0} />
      </div>
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div className={`swiss-card p-5 ${highlight ? "border-[#E63946] border-2" : ""}`}>
      <div className="swiss-label text-gray-500">{label}</div>
      <div className="font-display text-3xl font-extrabold mt-2">{value}</div>
    </div>
  );
}
