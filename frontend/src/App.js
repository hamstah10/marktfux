import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";

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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/" element={<Layout><Landing /></Layout>} />
          <Route path="/fahrzeuge" element={<Layout><Marketplace /></Layout>} />
          <Route path="/fahrzeuge/:id" element={<Layout><CarDetail /></Layout>} />
          <Route path="/login" element={<Layout><Login /></Layout>} />
          <Route path="/register" element={<Layout><Register /></Layout>} />
          <Route path="/favoriten" element={<Layout><Favorites /></Layout>} />

          <Route path="/dashboard" element={<ProtectedRoute role="dealer"><Layout><DealerLayout /></Layout></ProtectedRoute>}>
            <Route index element={<DealerListings />} />
            <Route path="anfragen" element={<DealerInquiries />} />
            <Route path="stats" element={<DealerStats />} />
            <Route path="neu" element={<CarForm />} />
            <Route path="bearbeiten/:id" element={<CarForm />} />
          </Route>

          <Route path="/admin" element={<ProtectedRoute role="admin"><Layout><AdminPanel /></Layout></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
