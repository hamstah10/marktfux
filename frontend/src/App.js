import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageTransition } from "@/components/Motion";

import Landing from "@/pages/Landing";
import Marketplace from "@/pages/Marketplace";
import CarDetail from "@/pages/CarDetail";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import DealerLayout from "@/pages/DealerLayout";
import DealerListings from "@/pages/DealerListings";
import DealerInquiries from "@/pages/DealerInquiries";
import DealerStats from "@/pages/DealerStats";
import CarForm from "@/pages/CarForm";
import AdminPanel from "@/pages/AdminPanel";
import Favorites from "@/pages/Favorites";
import Compare from "@/pages/Compare";
import DealerProfile from "@/pages/DealerProfile";

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Layout><PageTransition><Landing /></PageTransition></Layout>} />
        <Route path="/fahrzeuge" element={<Layout><PageTransition><Marketplace /></PageTransition></Layout>} />
        <Route path="/fahrzeuge/:id" element={<Layout><PageTransition><CarDetail /></PageTransition></Layout>} />
        <Route path="/login" element={<Layout><PageTransition><Login /></PageTransition></Layout>} />
        <Route path="/register" element={<Layout><PageTransition><Register /></PageTransition></Layout>} />
        <Route path="/favoriten" element={<Layout><PageTransition><Favorites /></PageTransition></Layout>} />
        <Route path="/vergleich" element={<Layout><PageTransition><Compare /></PageTransition></Layout>} />
        <Route path="/haendler/:id" element={<Layout><PageTransition><DealerProfile /></PageTransition></Layout>} />

        <Route path="/dashboard" element={<ProtectedRoute role="dealer"><Layout><PageTransition><DealerLayout /></PageTransition></Layout></ProtectedRoute>}>
          <Route index element={<DealerListings />} />
          <Route path="anfragen" element={<DealerInquiries />} />
          <Route path="stats" element={<DealerStats />} />
          <Route path="neu" element={<CarForm />} />
          <Route path="bearbeiten/:id" element={<CarForm />} />
        </Route>

        <Route path="/admin" element={<ProtectedRoute role="admin"><Layout><PageTransition><AdminPanel /></PageTransition></Layout></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <AnimatedRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
