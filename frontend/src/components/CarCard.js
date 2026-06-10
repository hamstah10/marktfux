import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { imgUrl } from "@/lib/api";
import { useFavorites } from "@/hooks/useFavorites";
import { useCompare } from "@/hooks/useCompare";
import { toast } from "sonner";
import { Calendar, Gauge, Zap, Settings as Cog, Heart, MapPin, ArrowRight, ShieldCheck, Store, User, GitCompareArrows } from "lucide-react";

const fmtPrice = (n) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
const fmtKm = (n) => new Intl.NumberFormat("de-DE").format(n || 0) + " km";

// Deterministic gradient per brand for photo placeholder
const gradients = [
  { bg: "linear-gradient(145deg, hsl(210 22% 90%), hsl(220 18% 78%))", fg: "hsl(210, 18%, 52%)", tagFg: "rgb(92,115,138)", brandFg: "rgb(62,82,101)" },
  { bg: "linear-gradient(145deg, hsl(0 22% 90%), hsl(40 16% 82%))",     fg: "hsl(0, 18%, 55%)",   tagFg: "rgb(138,92,92)",  brandFg: "rgb(101,62,62)" },
  { bg: "linear-gradient(145deg, hsl(150 22% 90%), hsl(190 16% 82%))",  fg: "hsl(150, 18%, 48%)", tagFg: "rgb(92,138,115)", brandFg: "rgb(62,101,82)" },
  { bg: "linear-gradient(145deg, hsl(45 32% 92%), hsl(30 20% 84%))",    fg: "hsl(35, 28%, 48%)",  tagFg: "rgb(140,108,72)", brandFg: "rgb(96,72,42)" },
];
function gradFor(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return gradients[h % gradients.length];
}

export default function CarCard({ v }) {
  const img = v.images?.[0];
  const { isFav, toggle: toggleFav } = useFavorites();
  const { isInCompare, toggle: toggleCmp } = useCompare();
  const fav = isFav(v.id);
  const inCmp = isInCompare(v.id);
  const sellerType = v.seller_type || "dealer";  // default dealer for legacy
  const verified = v.verified ?? sellerType === "dealer";
  const g = gradFor(v.brand);

  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
  const onFav = (e) => { stop(e); toggleFav(v.id); };
  const onCmp = (e) => {
    stop(e);
    const res = toggleCmp(v.id);
    if (res.full) toast.error("Maximal 3 Fahrzeuge im Vergleich.");
    else if (res.added) toast.success("Zum Vergleich hinzugefügt.");
  };

  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}>
      <Link
        to={`/fahrzeuge/${v.id}`}
        data-testid={`car-card-${v.id}`}
        className="block bg-[var(--card)] border border-[var(--hairline)]-[var(--radius-lg)] overflow-hidden shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-shadow"
      >
        {/* Photo area */}
        <div className="relative h-[190px] overflow-hidden" style={{ background: img ? "#f3f4f6" : g.bg }}>
          {img ? (
            <motion.img
              src={imgUrl(img)} alt={v.title} loading="lazy"
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.05 }} transition={{ duration: 0.5 }}
            />
          ) : (
            <>
              <div className="absolute inset-0 flex items-center justify-center" style={{ color: g.fg }}>
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                  <circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" />
                </svg>
              </div>
              <span className="absolute top-2.5 left-2.5 font-mono text-[9px] font-semibold tracking-[0.1em] px-1.5 py-0.5 bg-white/60 backdrop-blur" style={{ color: g.tagFg }}>FOTO</span>
              <span className="absolute bottom-2.5 left-2.5 font-display text-xs font-semibold" style={{ color: g.brandFg }}>{v.brand} {v.model}</span>
            </>
          )}

          {/* Fav button top-right */}
          <button
            onClick={onFav}
            data-testid={`fav-btn-${v.id}`}
            className={`absolute top-2.5 right-2.5 w-9 h-9 backdrop-blur flex items-center justify-center transition ${fav ? "bg-[var(--green)] text-white" : "bg-white/85 text-[var(--fg2)] hover:text-[var(--fg1)]"}`}
            aria-label={fav ? "Aus Merkliste entfernen" : "Merken"}
          >
            <Heart className="w-[18px] h-[18px]" fill={fav ? "currentColor" : "none"} />
          </button>

          {/* Compare button below fav */}
          <button
            onClick={onCmp}
            data-testid={`compare-btn-${v.id}`}
            className={`absolute top-[55px] right-2.5 w-9 h-9 backdrop-blur flex items-center justify-center transition ${inCmp ? "bg-[var(--fg1)] text-white" : "bg-white/85 text-[var(--fg2)] hover:text-[var(--fg1)]"}`}
            aria-label={inCmp ? "Aus Vergleich entfernen" : "Zum Vergleich"}
          >
            <GitCompareArrows className="w-[18px] h-[18px]" />
          </button>

          {/* Trust badge bottom-right */}
          {verified && (
            <span className="absolute bottom-2.5 right-2.5 badge badge-trust"><ShieldCheck className="w-3 h-3" /> Geprüft</span>
          )}
        </div>

        {/* Content */}
        <div className="p-[18px]">
          <div className="flex justify-between items-start gap-3">
            <div className="min-w-0">
              <div className="font-display font-bold text-[17px] text-[var(--fg1)] leading-tight tracking-[-0.01em] truncate">{v.title}</div>
              <div className="font-body text-[13px] text-[var(--fg2)] mt-0.5 truncate">{v.brand} {v.model}</div>
            </div>
            <span className={`badge ${sellerType === "private" ? "badge-private" : "badge-dealer"}`}>
              {sellerType === "private" ? <User className="w-3 h-3" /> : <Store className="w-3 h-3" />}
              {sellerType === "private" ? "Privat" : "Händler"}
            </span>
          </div>

          {/* Chips */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 my-3.5">
            <span className="chip"><Calendar className="w-[15px] h-[15px] text-[var(--fg3)]" /> {v.year}</span>
            <span className="chip"><Gauge className="w-[15px] h-[15px] text-[var(--fg3)]" /> {fmtKm(v.mileage)}</span>
            <span className="chip"><Zap className="w-[15px] h-[15px] text-[var(--fg3)]" /> {v.power_hp} PS</span>
            <span className="chip"><Cog className="w-[15px] h-[15px] text-[var(--fg3)]" /> {v.transmission}</span>
          </div>

          <div className="h-px bg-[var(--hairline)] my-3.5" />

          {/* Price + location + arrow */}
          <div className="flex justify-between items-end">
            <div>
              <div className="font-display font-bold text-2xl text-[var(--price)] tracking-[-0.02em]">{fmtPrice(v.price)}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-[13px] h-[13px] text-[var(--fg3)]" />
                <span className="font-body text-xs text-[var(--fg3)]">{v.location || "—"}</span>
              </div>
            </div>
            <span className="inline-flex items-center justify-center w-[38px] h-[38px]-[var(--radius-md)] bg-[var(--green-subtle)] text-[var(--green)]">
              <ArrowRight className="w-[18px] h-[18px]" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
