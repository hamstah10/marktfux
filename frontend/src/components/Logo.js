import React from "react";

/**
 * marktFUX wordmark in Orbitron 800 with double-rhombus mark.
 * Matches the UI-Kit / Prototype design specification.
 */
export default function Logo({ size = "md", className = "", inverted = false }) {
  const sizes = { sm: { icon: 22, text: "text-base" }, md: { icon: 28, text: "text-2xl" }, lg: { icon: 38, text: "text-3xl" } };
  const s = sizes[size] || sizes.md;
  const darkColor = inverted ? "text-white" : "text-[var(--fg1)]";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`} aria-label="marktFUX">
      <Mark height={s.icon} />
      <span className={`font-brand leading-none ${s.text}`}>
        <span className={darkColor}>markt</span>
        <span className="text-[var(--green)]">FUX</span>
      </span>
    </span>
  );
}

function Mark({ height = 28 }) {
  const w = (height * 22) / 32;
  return (
    <svg viewBox="0 0 22 32" height={height} width={w} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M11 0 L22 8 L11 16 L0 8 Z" fill="#239a5f" />
      <path d="M11 16 L22 24 L11 32 L0 24 Z" fill="#239a5f" opacity="0.85" />
    </svg>
  );
}
