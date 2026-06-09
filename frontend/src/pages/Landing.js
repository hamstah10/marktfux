import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import CarCard from "@/components/CarCard";
import { Search, Sparkles, ShieldCheck, Zap, ArrowRight } from "lucide-react";

const HERO_BG = "https://images.unsplash.com/photo-1603881359318-e2bc03deaaee?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA0MTJ8MHwxfHNlYXJjaHwzfHxzcG9ydHMlMjBjYXIlMjBkcml2aW5nJTIwcm9hZHxlbnwwfHx8fDE3ODA5NzQzODV8MA&ixlib=rb-4.1.0&q=85";
const SHOWROOM = "https://images.pexels.com/photos/16176576/pexels-photo-16176576.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

export default function Landing() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    api.get("/vehicles/featured").then((r) => setFeatured(r.data.items || [])).catch(() => {});
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    nav(`/fahrzeuge${q ? `?search=${encodeURIComponent(q)}` : ""}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0">
          <img src={HERO_BG} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/30" />
        </div>
        <div className="relative container-x py-24 md:py-36">
          <div className="swiss-label text-white/70 mb-5">Auto-Marktplatz · Deutschland</div>
          <h1 className="text-white font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-3xl">
            Das richtige Fahrzeug.<br />
            <span className="text-[#E63946]">Vom richtigen Händler.</span>
          </h1>
          <p className="text-gray-200 text-lg mt-6 max-w-xl leading-relaxed">
            Tausende geprüfte Inserate von vertrauenswürdigen Autohändlern. Klar, schnell, ohne Schnickschnack.
          </p>

          <form onSubmit={onSearch} className="mt-10 bg-white p-2 flex items-center gap-2 max-w-2xl border border-gray-200">
            <Search className="w-5 h-5 text-gray-400 ml-3" />
            <input
              data-testid="hero-search-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Marke, Modell oder Stichwort suchen…"
              className="flex-1 py-3 px-2 outline-none text-base"
            />
            <button data-testid="hero-search-submit" type="submit" className="swiss-btn-primary">
              Suchen <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="flex flex-wrap gap-x-8 gap-y-3 mt-8 text-sm text-gray-300">
            <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#E63946]" /> Geprüfte Händler</span>
            <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-[#E63946]" /> Schnell inserieren</span>
            <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#E63946]" /> KI-Inseratstexte</span>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="container-x py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="swiss-label text-[#E63946]">Aktuell</div>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-2">Neueste Inserate</h2>
          </div>
          <Link to="/fahrzeuge" data-testid="all-vehicles-link" className="hidden md:inline-flex items-center gap-2 swiss-label hover:text-[#E63946]">
            Alle Fahrzeuge <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="swiss-card p-12 text-center">
            <p className="text-gray-500">Noch keine Inserate. Sei der erste Händler auf der Plattform!</p>
            <Link to="/register" className="swiss-btn-primary mt-6 inline-flex">Händler werden</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((v) => (<CarCard key={v.id} v={v} />))}
          </div>
        )}
      </section>

      {/* For Dealers */}
      <section className="bg-[#F9FAFB] border-y border-gray-200">
        <div className="container-x py-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="swiss-label text-[#E63946]">Für Händler</div>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-2">
              Fahrzeuge in Minuten online.
            </h2>
            <p className="text-gray-600 mt-5 leading-relaxed max-w-lg">
              Lade Bilder hoch, gib die Eckdaten ein und lass die KI einen professionellen Inseratstext schreiben.
              So einfach war Fahrzeugverkauf noch nie.
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              <li className="flex items-start gap-3"><span className="w-1.5 h-1.5 mt-2 bg-[#E63946]" /><span>Sauberes Dashboard mit allen Inseraten & Anfragen</span></li>
              <li className="flex items-start gap-3"><span className="w-1.5 h-1.5 mt-2 bg-[#E63946]" /><span>KI-Beschreibungen auf Knopfdruck (GPT-5.2)</span></li>
              <li className="flex items-start gap-3"><span className="w-1.5 h-1.5 mt-2 bg-[#E63946]" /><span>Bildupload mit professioneller Darstellung</span></li>
            </ul>
            <Link to="/register" data-testid="cta-register-dealer" className="swiss-btn-primary mt-10 inline-flex">
              Jetzt Händler werden <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="aspect-[4/3] overflow-hidden">
            <img src={SHOWROOM} alt="Autohaus" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>
    </div>
  );
}
