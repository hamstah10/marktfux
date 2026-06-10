import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <Link
        to={`/fahrzeuge/${v.id}`}
        data-testid={`car-card-${v.id}`}
        className="swiss-card hover:shadow-xl block relative transition-shadow"
      >
        <div className="aspect-[4/3] overflow-hidden bg-gray-100 relative group">
          {img ? (
            <motion.img
              src={imgUrl(img)}
              alt={v.title}
              loading="lazy"
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.06 }}
              transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            />
          ) : (
            <ImagePlaceholder />
          )}
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute top-3 left-3 bg-white px-3 py-1 swiss-label"
          >
            {v.brand}
          </motion.div>
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              onClick={onFav}
              data-testid={`fav-btn-${v.id}`}
              aria-label={fav ? "Aus Merkliste entfernen" : "Merken"}
              className={`w-9 h-9 inline-flex items-center justify-center transition-colors ${fav ? "bg-[#16A34A] text-white" : "bg-white/95 text-gray-700 hover:bg-white"}`}
            >
              <Heart className="w-4 h-4" fill={fav ? "currentColor" : "none"} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              onClick={onCmp}
              data-testid={`compare-btn-${v.id}`}
              aria-label={inCmp ? "Aus Vergleich entfernen" : "Zum Vergleich"}
              className={`w-9 h-9 inline-flex items-center justify-center transition-colors ${inCmp ? "bg-[#0A0A0A] text-white" : "bg-white/95 text-gray-700 hover:bg-white"}`}
            >
              <GitCompareArrows className="w-4 h-4" />
            </motion.button>
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
    </motion.div>
  );
}
