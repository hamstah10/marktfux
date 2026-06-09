import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import CarCard from "@/components/CarCard";
import { Search, Sparkles, ShieldCheck, Zap, ArrowRight, ArrowUpRight, Star } from "lucide-react";

const HERO_BG = "https://images.unsplash.com/photo-1603881359318-e2bc03deaaee?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA0MTJ8MHwxfHNlYXJjaHwzfHxzcG9ydHMlMjBjYXIlMjBkcml2aW5nJTIwcm9hZHxlbnwwfHx8fDE3ODA5NzQzODV8MA&ixlib=rb-4.1.0&q=85";
const SHOWROOM = "https://images.pexels.com/photos/16176576/pexels-photo-16176576.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

const BRAND_STRIP = ["Mercedes-Benz", "BMW", "Audi", "Volkswagen", "Porsche", "Opel", "Ford", "Skoda", "Tesla", "Hyundai"];

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
      {/* ============== HERO ============== */}
      <section className="relative bg-[#0A0A0A] text-white overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_BG} alt="" className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/85 to-transparent" />
        </div>

        <div className="relative container-x pt-16 md:pt-24 pb-20 md:pb-32 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 fade-up">
            <div className="flex items-center gap-3 mb-6">
              <span className="inline-block w-10 h-px bg-[#E63946]" />
              <span className="swiss-label text-white/60">Auto-Marktplatz · DE/AT/CH</span>
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-tighter leading-[0.92]">
              Finde dein<br />
              nächstes <span className="serif-em text-[#E63946]">Lieblings</span>auto.
            </h1>

            <p className="text-gray-300 text-lg md:text-xl mt-8 max-w-xl leading-relaxed fade-up delay-1">
              Geprüfte Inserate, transparente Preise, direkt vom Händler.
              <span className="hidden md:inline"> Ohne Umwege, ohne Mittelsmann.</span>
            </p>

            <form onSubmit={onSearch} className="mt-12 bg-white p-2 flex items-stretch gap-2 max-w-2xl border-2 border-white shadow-2xl fade-up delay-2">
              <div className="flex-1 flex items-center gap-2 px-3">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  data-testid="hero-search-input"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="BMW 3er, Audi A4, Tesla Model 3 …"
                  className="flex-1 py-3 outline-none text-base text-gray-900 placeholder:text-gray-400 bg-transparent"
                />
              </div>
              <button data-testid="hero-search-submit" type="submit" className="swiss-btn-primary px-6">
                Suchen <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="flex flex-wrap gap-x-8 gap-y-3 mt-8 text-sm text-gray-300 fade-up delay-3">
              <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#E63946]" /> Geprüfte Händler</span>
              <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-[#E63946]" /> 2-Min Inserat</span>
              <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#E63946]" /> KI-Texte (GPT-5.2)</span>
            </div>
          </div>

          {/* Right floating stat card */}
          <div className="hidden lg:block lg:col-span-5 fade-up delay-2">
            <div className="relative ml-auto max-w-md">
              <div className="bg-white text-[#0A0A0A] p-8 border-2 border-white shadow-2xl">
                <div className="swiss-label text-[#E63946]">Diese Woche</div>
                <div className="font-display text-6xl font-extrabold mt-4 leading-none">+{featured.length || 0}</div>
                <div className="text-sm text-gray-500 mt-2">neue Inserate auf der Plattform</div>
                <Link to="/fahrzeuge" className="inline-flex items-center gap-2 mt-6 swiss-label text-[#0A0A0A] border-b border-[#0A0A0A] pb-1 hover:gap-3 transition-all">
                  Alle ansehen <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-[#E63946] text-white p-5 max-w-[200px] hidden xl:block">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-white" />)}
                </div>
                <div className="text-xs mt-2 leading-snug">„Mein Auto war in 4 Tagen verkauft. Keine Spammer." — Markus K., Händler</div>
              </div>
            </div>
          </div>
        </div>

        {/* Brand strip */}
        <div className="relative border-t border-white/10">
          <div className="container-x py-5 flex items-center gap-6">
            <span className="swiss-label text-white/40 hidden md:inline">Marken</span>
            <div className="marquee flex-1">
              <div className="marquee__track">
                {[...BRAND_STRIP, ...BRAND_STRIP].map((b, i) => (
                  <span key={i} className="font-display font-bold text-white/30 text-lg md:text-2xl tracking-tight whitespace-nowrap">{b}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== STATS ============== */}
      <section className="border-b border-gray-200">
        <div className="container-x py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { v: "10.000+", l: "Inserate" },
            { v: "500+", l: "Händler" },
            { v: "2 Min", l: "Bis dein Inserat online ist" },
            { v: "0 €", l: "Käufer-Gebühren" },
          ].map((s, i) => (
            <div key={i}>
              <div className="font-display text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tighter">{s.v}</div>
              <div className="swiss-label text-gray-500 mt-2">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ============== FEATURED ============== */}
      <section className="container-x py-20">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="swiss-label text-[#E63946]">Aktuell · frisch</div>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold tracking-tighter mt-3 max-w-2xl">
              Frisch <span className="serif-em">eingestellt</span>.
            </h2>
          </div>
          <Link to="/fahrzeuge" data-testid="all-vehicles-link" className="hidden md:inline-flex items-center gap-2 swiss-label hover:text-[#E63946] transition-colors group">
            Alle Fahrzeuge <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="swiss-card p-12 text-center">
            <p className="text-gray-500">Noch keine Inserate. Sei der erste Händler!</p>
            <Link to="/register" className="swiss-btn-primary mt-6 inline-flex">Händler werden</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((v) => (<CarCard key={v.id} v={v} />))}
          </div>
        )}
      </section>

      {/* ============== HOW IT WORKS ============== */}
      <section className="bg-[#0A0A0A] text-white">
        <div className="container-x py-24">
          <div className="max-w-3xl">
            <div className="swiss-label text-[#E63946]">So funktioniert's</div>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter mt-4">
              Drei Schritte.<br />
              <span className="serif-em text-[#E63946]">Null Bullshit.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-x-10 gap-y-12 mt-16">
            {[
              { n: "01", h: "Stöbern", d: "Suche nach Marke, Modell, Preis oder Standort. Filter so detailliert wie du magst." },
              { n: "02", h: "Vergleichen", d: "Markiere Fahrzeuge als Favoriten oder lege sie in den Side-by-Side Vergleich." },
              { n: "03", h: "Anfragen", d: "Schicke deine Anfrage direkt an den Händler — ohne Konto, ohne Spam." },
            ].map((s, i) => (
              <div key={i} className="border-t border-white/15 pt-8">
                <div className="step-num" style={{ WebkitTextStroke: "1.5px #FFFFFF" }}>{s.n}</div>
                <h3 className="font-display font-bold text-2xl mt-6">{s.h}</h3>
                <p className="text-gray-400 text-sm mt-3 leading-relaxed max-w-xs">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== FOR DEALERS ============== */}
      <section className="border-y border-gray-200">
        <div className="container-x py-24 grid lg:grid-cols-2 gap-16 items-center">
          <div className="aspect-[4/3] overflow-hidden bg-gray-100 order-2 lg:order-1">
            <img src={SHOWROOM} alt="Autohaus" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
          </div>
          <div className="order-1 lg:order-2">
            <div className="swiss-label text-[#E63946]">Für Händler</div>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold tracking-tighter mt-3 leading-[1.02]">
              Inserate, die <span className="serif-em">verkaufen</span> — nicht nur dasitzen.
            </h2>
            <p className="text-gray-600 mt-6 leading-relaxed max-w-lg text-lg">
              Lade Bilder hoch, gib die Eckdaten ein und lass die KI einen professionellen Inseratstext schreiben.
              Anfragen kommen direkt ins Dashboard, mit Lead-Tracking und Conversion-Analytics.
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              {[
                "Sauberes Dashboard mit Inseraten & Anfragen",
                "KI-Beschreibungen auf Knopfdruck (GPT-5.2)",
                "Views, Leads & Conversion pro Inserat",
                "Bewertungen & öffentliches Händlerprofil",
              ].map((t, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-800"><span className="w-1.5 h-1.5 mt-2 bg-[#E63946] flex-shrink-0" /><span>{t}</span></li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-3 mt-10">
              <Link to="/register" data-testid="cta-register-dealer" className="swiss-btn-primary">Jetzt Händler werden <ArrowRight className="w-4 h-4" /></Link>
              <Link to="/login" className="swiss-btn-secondary">Login</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============== FINAL CTA ============== */}
      <section className="container-x py-24 text-center">
        <div className="swiss-label text-[#E63946]">Bereit?</div>
        <h2 className="font-display text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter mt-4 max-w-4xl mx-auto leading-[0.95]">
          Dein nächster <span className="serif-em">Schlüssel</span> wartet schon.
        </h2>
        <div className="flex items-center justify-center gap-3 mt-10">
          <Link to="/fahrzeuge" className="swiss-btn-primary">Fahrzeuge ansehen <ArrowRight className="w-4 h-4" /></Link>
          <Link to="/register" className="swiss-btn-secondary">Händler werden</Link>
        </div>
      </section>
    </div>
  );
}
