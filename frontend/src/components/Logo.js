import React from "react";

/**
 * marktFUX official logo (PNG with transparent background).
 * Works on light AND dark surfaces.
 */
export default function Logo({ size = "md", className = "" }) {
  const heights = { sm: 22, md: 32, lg: 48, xl: 72 };
  const h = heights[size] || heights.md;
  return (
    <img
      src="/marktfux-logo.png"
      alt="marktFUX"
      height={h}
      style={{ height: h, width: "auto", display: "block" }}
      className={`select-none ${className}`}
      draggable={false}
    />
  );
}
