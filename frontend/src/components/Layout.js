import React from "react";
import Header from "./Header";
import Footer from "./Footer";

export default function Layout({ children, hideFooter = false }) {
  return (
    <div className="min-h-screen bg-[#EDEDEF]">
      <div className="mx-auto w-full max-w-[1440px] md:my-6 lg:my-8 bg-white md:shadow-[0_4px_30px_-10px_rgba(10,10,10,0.18)] md:border md:border-gray-200">
        <div className="sticky top-0 md:top-6 lg:top-8 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <Header />
        </div>
        <main>{children}</main>
        {!hideFooter && <Footer />}
      </div>
    </div>
  );
}
