import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import CarCard from "@/components/CarCard";
import { Reveal, StaggerItem, CountUp } from "@/components/Motion";
import { Search, MapPin, ArrowRight, ShieldCheck, Mail, Car, User, Store } from "lucide-react";

const POPULAR_BRANDS = ["BMW", "VW", "Audi", "Mercedes-Benz", "Porsche", "Tesla", "Ford", "Skoda"];

const CATEGORIES = [
  { name: "SUV / Geländewagen", count: 142380 },
  { name: "Limousine", count: 98210 },
  { name: "Kombi", count: 76940 },
  { name: "Kleinwagen", count: 64120 },
  { name: "Cabrio", count: 21560 },
  { name: "Elektro", count: 38470 },
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
      <section style={{ background: "var(--gradient-hero)" }} className="border-b border-[var(--hairline)]">
        <div className="page-wrap max-w-[980px] pt-16 md:pt-20 pb-12 md:pb-16 text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}
            className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[var(--green)] bg-[var(--green-subtle)] border border-[var(--green-border)] px-3.5 py-1.5 tracking-[0.04em]"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Geprüfte Sicherheit · Vertrauen seit Tag 1
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05, ease }}
            className="font-display font-bold mt-5 mb-4 leading-[1.05] tracking-[-0.035em]"
            style={{ fontSize: "clamp(2.4rem, 5vw, 3.4rem)" }}
          >
            <span style={{ color: "var(--fg1)" }}>Dein nächstes Auto.</span><br />
            <span style={{ color: "var(--green)" }}>Sicher gekauft, fair verkauft.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.15 }}
            className="font-body text-[17px] md:text-[18px] text-[var(--fg2)] leading-[1.6] max-w-[600px] mx-auto mb-9"
          >
            Vertrauensvoller Marktplatz für Gebrauchtwagen — von Privat und vom Händler. Geprüfte Inserate, klare Preise.
          </motion.p>

          {/* Search */}
          <motion.form
            onSubmit={onSearch}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25, ease }}
            className="bg-[var(--card)] border border-[var(--hairline)]-[var(--radius-lg)] p-2.5 flex flex-col sm:flex-row gap-2 items-stretch max-w-[720px] mx-auto"
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
            className="flex flex-wrap gap-2 justify-center mt-6"
          >
            <span className="font-body text-[13px] text-[var(--fg3)] self-center mr-1">Beliebt:</span>
            {POPULAR_BRANDS.map((b) => (
              <button key={b} onClick={() => nav(`/fahrzeuge?brand=${encodeURIComponent(b === "Mercedes-Benz" ? "Mercedes" : b)}`)} className="font-body text-[13px] font-medium text-[var(--fg2)] bg-[var(--card)] border border-[var(--hairline)] px-3.5 py-1.5 hover:border-[var(--green)] hover:text-[var(--green)] transition-colors">
                {b}
              </button>
            ))}
          </motion.div>
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
                className="w-full flex items-center justify-between gap-3.5 bg-[var(--card)] border border-[var(--hairline)]-[var(--radius-lg)] py-5 px-5 cursor-pointer text-left shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-card)] hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <span className="w-11 h-11 bg-[var(--green-subtle)] text-[var(--green)] flex items-center justify-center flex-shrink-0">
                    <Car className="w-6 h-6" />
                  </span>
                  <div>
                    <div className="font-display font-semibold text-[16px] text-[var(--fg1)]">{c.name}</div>
                    <div className="font-body text-[13px] text-[var(--fg2)]">{new Intl.NumberFormat("de-DE").format(c.count)} Angebote</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--fg3)]" />
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
