import React from "react";
import Header from "./Header";
import Footer from "./Footer";

export default function Layout({ children, hideFooter = false }) {
  return (
    <div className="min-h-screen bg-[#EDEDEF]">
      {/* Sticky top navigation — fixed to viewport top */}
      <div className="sticky top-0 z-50 bg-[#EDEDEF]/95 backdrop-blur supports-[backdrop-filter]:bg-[#EDEDEF]/75">
        <div className="mx-auto w-full max-w-[1440px] bg-white border-b border-gray-200 md:border md:border-gray-200 md:mt-4 md:shadow-[0_2px_20px_-8px_rgba(10,10,10,0.18)]">
          <Header />
        </div>
      </div>

      {/* Content boxed below */}
      <div className="md:pt-4 md:pb-6 lg:pb-8">
        <div className="mx-auto w-full max-w-[1440px] bg-white md:shadow-[0_4px_30px_-10px_rgba(10,10,10,0.15)] md:border md:border-gray-200">
          <main>{children}</main>
          {!hideFooter && <Footer />}
        </div>
      </div>
    </div>
  );
}
