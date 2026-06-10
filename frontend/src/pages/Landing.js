import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import CarCard from "@/components/CarCard";
import { Reveal, StaggerItem, CountUp } from "@/components/Motion";
import { Search, MapPin, ArrowRight, ShieldCheck, Mail, Car, User, Store } from "lucide-react";

const POPULAR_BRANDS = ["BMW", "VW", "Audi", "Mercedes-Benz", "Porsche", "Tesla", "Ford", "Skoda"];

// Hero motifs — full-bleed car imagery strip below the hero
const MOTIFS = [
  { label: "Sportwagen", filter: "Porsche", img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&h=600&fit=crop&q=80" },
  { label: "SUV", filter: "BMW", img: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=900&h=600&fit=crop&q=80" },
  { label: "Elektro", filter: "Tesla", img: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=900&h=600&fit=crop&q=80" },
  { label: "Klassiker", filter: "Mercedes", img: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=900&h=600&fit=crop&q=80" },
];

const CATEGORIES = [
  { name: "SUV / Geländewagen", count: 142380, img: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&h=400&fit=crop&q=80" },
  { name: "Limousine", count: 98210, img: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&h=400&fit=crop&q=80" },
  { name: "Kombi", count: 76940, img: "https://images.unsplash.com/photo-1551830820-330a71b99659?w=600&h=400&fit=crop&q=80" },
  { name: "Kleinwagen", count: 64120, img: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&h=400&fit=crop&q=80" },
  { name: "Cabrio", count: 21560, img: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&h=400&fit=crop&q=80" },
  { name: "Elektro", count: 38470, img: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=600&h=400&fit=crop&q=80" },
];

const ease = [0.2, 0.8, 0.2, 1];

export default function Landing() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [zip, setZip] = useState("");
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    api.get("/vehicles/featured").then((r) => setFeatured(r.data.items || [])).catch(() => {});
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("search", q);
    if (zip) params.set("location", zip);
    nav(`/fahrzeuge${params.toString() ? "?" + params.toString() : ""}`);
  };

  return (
    <div>
      {/* ============== HERO ============== */}
      <section style={{ background: "var(--gradient-hero)" }} className="border-b border-[var(--hairline)] relative overflow-hidden">
        {/* Right-side car motif */}
        <div className="absolute inset-y-0 right-0 w-[55%] hidden lg:block pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=1400&h=900&fit=crop&q=85")',
            backgroundSize: "cover",
            backgroundPosition: "center left",
          }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, var(--bg) 0%, transparent 55%, transparent 100%)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 0%, transparent 70%, var(--bg) 100%)" }} />
        </div>

        {/* Decorative accent bars */}
        <div className="absolute top-10 left-0 w-20 h-1 bg-[var(--green)] hidden md:block" />
        <div className="absolute bottom-8 right-0 w-20 h-1 bg-[var(--green)] hidden lg:block" />

        <div className="page-wrap py-16 md:py-20 relative">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
            <div>
              <motion.span
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}
                className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[var(--green)] bg-[var(--green-subtle)] border border-[var(--green-border)] px-3.5 py-1.5 tracking-[0.04em]"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Geprüfte Sicherheit · Vertrauen seit Tag 1
              </motion.span>

              <motion.h1
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05, ease }}
                className="font-display font-bold mt-5 mb-4 leading-[1.05] tracking-[-0.035em]"
                style={{ fontSize: "clamp(2.4rem, 4.6vw, 3.6rem)" }}
              >
                <span style={{ color: "var(--fg1)" }}>Dein nächstes Auto.</span><br />
                <span style={{ color: "var(--green)" }}>Sicher gekauft, fair verkauft.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.15 }}
                className="font-body text-[17px] text-[var(--fg2)] leading-[1.6] max-w-[520px] mb-9"
              >
                Vertrauensvoller Marktplatz für Gebrauchtwagen — von Privat und vom Händler. Geprüfte Inserate, klare Preise.
              </motion.p>

              {/* Search */}
              <motion.form
                onSubmit={onSearch}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25, ease }}
                className="bg-[var(--card)] border border-[var(--hairline)] p-2.5 flex flex-col sm:flex-row gap-2 items-stretch max-w-[640px]"
                style={{ boxShadow: "var(--shadow-elevated)" }}
              >
                <div className="flex-[2] flex items-center gap-2.5 px-3.5">
                  <Search className="w-5 h-5 text-[var(--fg3)] flex-shrink-0" />
                  <input
                    data-testid="hero-search-input"
                    value={q} onChange={(e) => setQ(e.target.value)}
                    placeholder="Marke, Modell oder Stichwort"
                    className="flex-1 min-w-0 border-none outline-none bg-transparent font-body text-[15px] text-[var(--fg1)] py-3 placeholder:text-[var(--fg3)]"
                  />
                </div>
                <div className="hidden sm:block w-px h-8 self-center bg-[var(--hairline)]" />
                <div className="flex-1 flex items-center gap-2.5 px-3.5">
                  <MapPin className="w-5 h-5 text-[var(--fg3)] flex-shrink-0" />
                  <input
                    data-testid="hero-location-input"
                    value={zip} onChange={(e) => setZip(e.target.value)}
                    placeholder="PLZ / Ort"
                    className="flex-1 min-w-0 border-none outline-none bg-transparent font-body text-[15px] text-[var(--fg1)] py-3 placeholder:text-[var(--fg3)]"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  type="submit" data-testid="hero-search-submit"
                  className="btn btn-primary px-7"
                >
                  <Search className="w-4 h-4" /> Suchen
                </motion.button>
              </motion.form>

              {/* Popular brands */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-wrap gap-2 mt-6"
              >
                <span className="font-body text-[13px] text-[var(--fg3)] self-center mr-1">Beliebt:</span>
                {POPULAR_BRANDS.map((b) => (
                  <button key={b} onClick={() => nav(`/fahrzeuge?brand=${encodeURIComponent(b === "Mercedes-Benz" ? "Mercedes" : b)}`)} className="font-body text-[13px] font-medium text-[var(--fg2)] bg-[var(--card)] border border-[var(--hairline)] px-3.5 py-1.5 hover:border-[var(--green)] hover:text-[var(--green)] transition-colors">
                    {b}
                  </button>
                ))}
              </motion.div>
            </div>

            {/* Right floating stat tiles */}
            <div className="hidden lg:flex flex-col items-end gap-4 relative z-10">
              <motion.div
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.3, ease }}
                className="bg-[var(--card)] border border-[var(--hairline)] p-5 max-w-[280px] w-full"
                style={{ boxShadow: "var(--shadow-elevated)" }}
              >
                <div className="font-mono text-[10px] text-[var(--green)] tracking-[0.1em] uppercase font-semibold">Diese Woche</div>
                <div className="font-display text-3xl font-extrabold text-[var(--fg1)] mt-2 leading-none">+<CountUp to={featured.length || 0} /></div>
                <div className="font-body text-xs text-[var(--fg2)] mt-1">neue geprüfte Inserate</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.45, ease }}
                className="bg-[var(--fg1)] text-white p-5 max-w-[280px] w-full"
              >
                <div className="font-mono text-[10px] text-[var(--green)] tracking-[0.1em] uppercase font-semibold">Bewertungen</div>
                <div className="flex items-center gap-1 mt-2">
                  {[...Array(5)].map((_, i) => <span key={i} className="text-[var(--trust)] text-lg leading-none">★</span>)}
                </div>
                <p className="font-body text-[13px] text-gray-300 mt-2 leading-snug">„In 4 Tagen verkauft, keine Spammer." — Markus K., Händler</p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== MOTIF STRIP ============== */}
      <section className="bg-[var(--fg1)]">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {MOTIFS.map((m, i) => (
            <motion.button
              key={m.label}
              onClick={() => nav(`/fahrzeuge?brand=${encodeURIComponent(m.filter)}`)}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08, ease }}
              className="relative aspect-[3/2] overflow-hidden group cursor-pointer block"
            >
              <img src={m.img} alt={m.label} className="absolute inset-0 w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent transition-opacity duration-500" />
              <div className="absolute inset-x-0 bottom-0 p-5 md:p-7 text-left">
                <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-white/70 font-semibold">Entdecken</div>
                <div className="font-display font-bold text-white text-xl md:text-2xl tracking-[-0.02em] mt-1 flex items-center gap-2">
                  {m.label}
                  <ArrowRight className="w-5 h-5 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
                </div>
              </div>
              <div className="absolute top-0 left-0 w-1 h-0 bg-[var(--green)] group-hover:h-full transition-all duration-500" />
            </motion.button>
          ))}
        </div>
      </section>

      {/* ============== FEATURED ============== */}
      <section className="page-wrap pt-14">
        <Reveal>
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="font-display font-bold text-[28px] text-[var(--fg1)] tracking-[-0.02em]">Empfohlene Fahrzeuge</h2>
              <p className="font-body text-[15px] text-[var(--fg2)] mt-1">Handverlesen aus geprüften Inseraten.</p>
            </div>
            <Link to="/fahrzeuge" data-testid="all-vehicles-link" className="hidden md:inline-flex items-center gap-1.5 font-display font-semibold text-sm text-[var(--green)] hover:gap-2 transition-all">
              Alle ansehen <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Reveal>
        {featured.length === 0 ? (
          <Reveal>
            <div className="swiss-card p-12 text-center">
              <Car className="w-10 h-10 mx-auto text-[var(--fg3)]" />
              <p className="text-[var(--fg2)] mt-3">Noch keine Inserate. Sei der erste Händler!</p>
              <Link to="/register" className="btn btn-primary mt-5 inline-flex">Inserat aufgeben</Link>
            </div>
          </Reveal>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.slice(0, 6).map((v, i) => (
              <StaggerItem key={v.id} index={i}><CarCard v={v} /></StaggerItem>
            ))}
          </div>
        )}
      </section>

      {/* ============== CATEGORIES ============== */}
      <section className="page-wrap pt-14">
        <Reveal>
          <h2 className="font-display font-bold text-[28px] text-[var(--fg1)] tracking-[-0.02em] mb-6">Nach Fahrzeugtyp</h2>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map((c, i) => (
            <Reveal key={c.name} delay={i * 0.04}>
              <button
                onClick={() => nav(`/fahrzeuge`)}
                className="group w-full text-left bg-[var(--card)] border border-[var(--hairline)] overflow-hidden shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-elevated)] transition-all"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-[var(--muted-fill)]">
                  <img src={c.img} alt={c.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 bg-white px-2.5 py-1 font-mono text-[10px] tracking-[0.1em] uppercase font-semibold text-[var(--fg1)]">{new Intl.NumberFormat("de-DE").format(c.count)}</div>
                </div>
                <div className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <div className="font-display font-semibold text-[16px] text-[var(--fg1)]">{c.name}</div>
                    <div className="font-body text-[13px] text-[var(--fg2)]">Angebote ansehen</div>
                  </div>
                  <span className="inline-flex items-center justify-center w-9 h-9 bg-[var(--green-subtle)] text-[var(--green)] group-hover:bg-[var(--green)] group-hover:text-white transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============== SELL CTA ============== */}
      <section className="page-wrap pt-14">
        <Reveal>
          <div className="text-center mb-7">
            <h2 className="font-display font-bold text-[28px] text-[var(--fg1)] tracking-[-0.02em]">Du willst verkaufen?</h2>
            <p className="font-body text-[15px] text-[var(--fg2)] mt-1.5">Egal ob privat oder gewerblich — wir haben den passenden Weg.</p>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Reveal delay={0.05}>
            <div className="flex gap-4 items-center bg-[var(--card)] border border-[var(--hairline)]-[var(--radius-xl)] shadow-[var(--shadow-card)] p-7">
              <div className="w-14 h-14 bg-[var(--private-tint)] text-[var(--private-fg)] flex items-center justify-center flex-shrink-0">
                <User className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <span className="font-mono text-[11px] font-semibold text-[var(--private-fg)] tracking-[0.06em] uppercase">Privatverkäufer</span>
                <div className="font-display font-bold text-[20px] text-[var(--fg1)] tracking-[-0.01em] mt-1 mb-1.5">Privat verkaufen</div>
                <p className="font-body text-sm text-[var(--fg2)] leading-[1.55] mb-4">Kostenlos inserieren und tausende Käufer in deiner Region erreichen.</p>
                <Link to="/register" className="btn btn-secondary btn-sm">Inserat erstellen <ArrowRight className="w-4 h-4" /></Link>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="flex gap-4 items-center bg-[var(--card)] border border-[var(--hairline)]-[var(--radius-xl)] shadow-[var(--shadow-card)] p-7">
              <div className="w-14 h-14 bg-[var(--green-subtle)] text-[var(--green)] flex items-center justify-center flex-shrink-0">
                <Store className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <span className="font-mono text-[11px] font-semibold text-[var(--green)] tracking-[0.06em] uppercase">Autohäuser &amp; Händler</span>
                <div className="font-display font-bold text-[20px] text-[var(--fg1)] tracking-[-0.01em] mt-1 mb-1.5">Als Händler verkaufen</div>
                <p className="font-body text-sm text-[var(--fg2)] leading-[1.55] mb-4">Bestand verwalten, mehr qualifizierte Leads und eine eigene Händlerseite.</p>
                <Link to="/register" data-testid="cta-register-dealer" className="btn btn-primary btn-sm">Händlerkonto entdecken <ArrowRight className="w-4 h-4" /></Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============== HOW IT WORKS ============== */}
      <section className="bg-[var(--card)] border-t border-[var(--hairline)] border-b mt-14">
        <div className="page-wrap max-w-[1100px] py-14">
          <div className="text-center mb-10">
            <span className="font-mono text-xs font-semibold text-[var(--green)] tracking-[0.1em] uppercase">So funktioniert's</span>
            <h2 className="font-display font-bold text-[30px] text-[var(--fg1)] tracking-[-0.02em] mt-2.5">In drei Schritten zum Auto</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {[
              { icon: Search, n: 1, h: "Finden", d: "Durchsuche Tausende Fahrzeuge mit smarten Filtern für Privat- und Händlerangebote." },
              { icon: Mail, n: 2, h: "Kontaktieren", d: "Schreibe Verkäufer sicher über marktFUX — deine Daten bleiben geschützt." },
              { icon: ShieldCheck, n: 3, h: "Sicher kaufen", d: "Geprüfte Händler, Trust-Siegel und klare Sicherheitshinweise bei jedem Inserat." },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="text-center">
                  <div className="relative w-16 h-16-[18px] bg-[var(--green-subtle)] text-[var(--green)] flex items-center justify-center mx-auto mb-4">
                    <s.icon className="w-[30px] h-[30px]" />
                    <span className="absolute -top-2 -right-2 w-[26px] h-[26px] bg-[var(--green)] text-white font-display font-bold text-[13px] flex items-center justify-center">{s.n}</span>
                  </div>
                  <div className="font-display font-bold text-[19px] text-[var(--fg1)] mb-2">{s.h}</div>
                  <p className="font-body text-[14.5px] text-[var(--fg2)] leading-[1.6] max-w-[280px] mx-auto">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
