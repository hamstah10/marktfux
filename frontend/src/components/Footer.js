import React from "react";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0A] text-white mt-24">
      <div className="container-x py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <Logo size="md" inverted />
          <p className="text-sm text-gray-400 mt-4 leading-relaxed">Die fokussierte Plattform für seriöse Autohändler und Käufer im deutschsprachigen Raum.</p>
        </div>
        <div>
          <div className="swiss-label text-gray-400 mb-3">Plattform</div>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>Fahrzeuge</li>
            <li>Händler werden</li>
            <li>Über uns</li>
          </ul>
        </div>
        <div>
          <div className="swiss-label text-gray-400 mb-3">Rechtliches</div>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>Impressum</li>
            <li>Datenschutz</li>
            <li>AGB</li>
          </ul>
        </div>
        <div>
          <div className="swiss-label text-gray-400 mb-3">Kontakt</div>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>hallo@marktfux.de</li>
            <li>+49 30 1234 5678</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 py-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} marktFUX — Alle Rechte vorbehalten.
      </div>
    </footer>
  );
}
