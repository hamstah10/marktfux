import React from "react";
import { Link } from "react-router-dom";
import { imgUrl } from "@/lib/api";
import { Gauge, Calendar, Fuel, MapPin } from "lucide-react";

const fmtPrice = (n) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
const fmtKm = (n) => new Intl.NumberFormat("de-DE").format(n || 0) + " km";

export default function CarCard({ v }) {
  const img = v.images?.[0];
  return (
    <Link
      to={`/fahrzeuge/${v.id}`}
      data-testid={`car-card-${v.id}`}
      className="swiss-card swiss-card-hover group block"
    >
      <div className="aspect-[4/3] overflow-hidden bg-gray-100 relative">
        {img ? (
          <img src={imgUrl(img)} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Kein Bild</div>
        )}
        <div className="absolute top-3 left-3 bg-white px-3 py-1 swiss-label">{v.brand}</div>
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
