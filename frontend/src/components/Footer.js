import React from "react";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="bg-[var(--card)] border-t border-[var(--hairline)] mt-20">
      <div className="page-wrap py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <Logo size="md" />
          <p className="text-sm text-[var(--fg2)] mt-4 leading-relaxed max-w-xs">Vertrauensvoller Marktplatz für Gebrauchtwagen — von Privat und vom Händler.</p>
        </div>
        <div>
          <div className="swiss-label mb-3">Marktplatz</div>
          <ul className="space-y-2 text-sm text-[var(--fg2)]">
            <li>Fahrzeuge suchen</li>
            <li>Inserat aufgeben</li>
            <li>Händlerkonto</li>
          </ul>
        </div>
        <div>
          <div className="swiss-label mb-3">Rechtliches</div>
          <ul className="space-y-2 text-sm text-[var(--fg2)]">
            <li>Impressum</li>
            <li>Datenschutz</li>
            <li>AGB</li>
          </ul>
        </div>
        <div>
          <div className="swiss-label mb-3">Kontakt</div>
          <ul className="space-y-2 text-sm text-[var(--fg2)]">
            <li>hallo@marktfux.de</li>
            <li>+49 30 1234 5678</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[var(--hairline)] py-5 text-center text-xs text-[var(--fg3)] font-mono tracking-wider">
        © {new Date().getFullYear()} marktFUX · Alle Rechte vorbehalten
      </div>
    </footer>
  );
}
