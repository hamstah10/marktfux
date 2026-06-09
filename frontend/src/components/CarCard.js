import React from "react";
import { Link } from "react-router-dom";
import { imgUrl } from "@/lib/api";
import { useFavorites } from "@/hooks/useFavorites";
import { useCompare } from "@/hooks/useCompare";
import { toast } from "sonner";
import { Gauge, Calendar, Fuel, MapPin, Heart, GitCompareArrows } from "lucide-react";
import ImagePlaceholder from "./ImagePlaceholder";

const fmtPrice = (n) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
const fmtKm = (n) => new Intl.NumberFormat("de-DE").format(n || 0) + " km";

export default function CarCard({ v }) {
  const img = v.images?.[0];
  const { isFav, toggle: toggleFav } = useFavorites();
  const { isInCompare, toggle: toggleCmp } = useCompare();
  const fav = isFav(v.id);
  const inCmp = isInCompare(v.id);

  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
  const onFav = (e) => { stop(e); toggleFav(v.id); };
  const onCmp = (e) => {
    stop(e);
    const res = toggleCmp(v.id);
    if (res.full) toast.error("Maximal 3 Fahrzeuge im Vergleich.");
    else if (res.added) toast.success("Zum Vergleich hinzugefügt.");
  };

  return (
    <Link
      to={`/fahrzeuge/${v.id}`}
      data-testid={`car-card-${v.id}`}
      className="swiss-card swiss-card-hover group block relative"
    >
      <div className="aspect-[4/3] overflow-hidden bg-gray-100 relative">
        {img ? (
          <img src={imgUrl(img)} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <ImagePlaceholder />
        )}
        <div className="absolute top-3 left-3 bg-white px-3 py-1 swiss-label">{v.brand}</div>
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <button
            onClick={onFav}
            data-testid={`fav-btn-${v.id}`}
            aria-label={fav ? "Aus Merkliste entfernen" : "Merken"}
            title={fav ? "Aus Merkliste entfernen" : "Merken"}
            className={`w-9 h-9 inline-flex items-center justify-center transition-all ${fav ? "bg-[#E63946] text-white" : "bg-white/95 text-gray-700 hover:bg-white"}`}
          >
            <Heart className="w-4 h-4" fill={fav ? "currentColor" : "none"} />
          </button>
          <button
            onClick={onCmp}
            data-testid={`compare-btn-${v.id}`}
            aria-label={inCmp ? "Aus Vergleich entfernen" : "Zum Vergleich"}
            title={inCmp ? "Aus Vergleich entfernen" : "Zum Vergleich"}
            className={`w-9 h-9 inline-flex items-center justify-center transition-all ${inCmp ? "bg-[#0A0A0A] text-white" : "bg-white/95 text-gray-700 hover:bg-white"}`}
          >
            <GitCompareArrows className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-display font-bold text-lg leading-tight line-clamp-1">{v.title}</h3>
        <div className="text-2xl font-display font-extrabold text-[#0A0A0A] mt-2">{fmtPrice(v.price)}</div>
        <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-gray-600">
          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {v.year}</span>
          <span className="flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5" /> {fmtKm(v.mileage)}</span>
          <span className="flex items-center gap-1.5"><Fuel className="w-3.5 h-3.5" /> {v.fuel}</span>
          <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {v.location || "—"}</span>
        </div>
      </div>
    </Link>
  );
}
