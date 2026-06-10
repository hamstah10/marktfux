import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useFavorites } from "@/hooks/useFavorites";
import CarCard from "@/components/CarCard";
import { Heart, Trash2 } from "lucide-react";

export default function Favorites() {
  const { favorites, count, remove } = useFavorites();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (favorites.length === 0) {
      setItems([]); setLoading(false); return;
    }
    setLoading(true);
    api.post("/vehicles/by-ids", { ids: favorites }).then((r) => {
      const map = new Map(r.data.items.map((v) => [v.id, v]));
      // preserve favorites order
      setItems(favorites.map((id) => map.get(id)).filter(Boolean));
      // cleanup: if any IDs no longer exist (unpublished), remove from local storage
      r.data.items.length !== favorites.length &&
        favorites.forEach((id) => !map.has(id) && remove(id));
    }).finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [favorites.join(",")]);

  return (
    <div className="page-wrap py-10">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="swiss-label text-[#16A34A] flex items-center gap-2"><Heart className="w-3.5 h-3.5" fill="currentColor" /> Merkliste</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-2">Deine gemerkten Fahrzeuge</h1>
          <p className="text-sm text-gray-500 mt-1">{count} {count === 1 ? "Eintrag" : "Einträge"} — lokal auf diesem Gerät gespeichert.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500">Lade…</div>
      ) : items.length === 0 ? (
        <div className="swiss-card p-12 text-center" data-testid="empty-favorites">
          <Heart className="w-10 h-10 mx-auto text-gray-300" />
          <h3 className="font-display text-xl font-bold mt-4">Noch nichts gemerkt</h3>
          <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">Klicke auf das Herz-Symbol bei einem Inserat, um es zur Merkliste hinzuzufügen.</p>
          <Link to="/fahrzeuge" className="swiss-btn-primary mt-6 inline-flex">Fahrzeuge durchsuchen</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" data-testid="favorites-grid">
          {items.map((v) => <CarCard key={v.id} v={v} />)}
        </div>
      )}
    </div>
  );
}
