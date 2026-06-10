import React from "react";
import Header from "./Header";
import Footer from "./Footer";

export default function Layout({ children, hideFooter = false }) {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      <div className="sticky top-0 z-50 bg-[var(--card)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--card)]/80 border-b border-[var(--hairline)]">
        <Header />
      </div>
      <main className="flex-1">{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
}
