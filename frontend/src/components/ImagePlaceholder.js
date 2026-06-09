import React from "react";
import { Car } from "lucide-react";

export default function ImagePlaceholder({ size = "md", className = "" }) {
  const cls = size === "sm" ? "w-5 h-5" : "w-10 h-10";
  return (
    <div className={`w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-300 ${className}`} aria-hidden="true">
      <Car className={cls} strokeWidth={1.25} />
      {size !== "sm" && <span className="text-[10px] uppercase tracking-widest mt-1.5 text-gray-400 font-semibold">Kein Bild</span>}
    </div>
  );
}
