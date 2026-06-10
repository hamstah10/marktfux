import React from "react";

/**
 * marktFUX wordmark.
 * - "markt" in dark, "FUX" in green
 * - Logo mark: two stacked rhombi forming an "X" / hourglass
 */
export default function Logo({ size = "md", className = "", inverted = false }) {
  const sizes = {
    sm: { h: 22, text: "text-lg" },
    md: { h: 28, text: "text-2xl" },
    lg: { h: 40, text: "text-4xl" },
  };
  const s = sizes[size] || sizes.md;
  const textColor = inverted ? "text-white" : "text-[#0A0A0A]";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`} aria-label="marktFUX">
      <Mark height={s.h} />
      <span className={`font-brand leading-none ${s.text}`}>
        <span className={textColor}>markt</span><span className="text-[#16A34A]">FUX</span>
      </span>
    </span>
  );
}

function Mark({ height = 28 }) {
  // Stylized double-rhombus mark in brand green
  return (
    <svg
      viewBox="0 0 28 40"
      height={height}
      width={(height * 28) / 40}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M14 0 L28 10 L14 20 L0 10 Z" fill="#16A34A" />
      <path d="M14 20 L28 30 L14 40 L0 30 Z" fill="#16A34A" opacity="0.85" />
    </svg>
  );
}
