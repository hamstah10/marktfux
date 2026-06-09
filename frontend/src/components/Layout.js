import React from "react";
import Header from "./Header";
import Footer from "./Footer";

export default function Layout({ children, hideFooter = false }) {
  return (
    <div className="min-h-screen bg-[#EDEDEF] py-0 md:py-6 lg:py-8">
      <div className="mx-auto w-full max-w-[1440px] bg-white md:shadow-[0_4px_30px_-10px_rgba(10,10,10,0.15)] md:border md:border-gray-200">
        <Header />
        <main>{children}</main>
        {!hideFooter && <Footer />}
      </div>
    </div>
  );
}
