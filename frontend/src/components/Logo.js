import React from "react";

/**
 * marktFUX official logo (with transparent background).
 * Use `inverted={false}` (default) on light backgrounds — the dark "markt" text + green icon + green "FUX" stay visible.
 * Use `inverted={true}` on dark backgrounds — same image works, since the cut-out background is fully transparent.
 */
export default function Logo({ size = "md", className = "", inverted = false }) {
  const heights = { sm: 24, md: 36, lg: 56, xl: 80 };
  const h = heights[size] || heights.md;

  return (
    <img
      src="/marktfux-logo.png"
      alt="marktFUX"
      height={h}
      style={{ height: h, width: "auto", display: "block" }}
      className={`select-none ${inverted ? "" : ""} ${className}`}
      draggable={false}
    />
  );
}
