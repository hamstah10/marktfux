import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container-x py-20 text-center text-gray-500">Lade…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  if (role === "dealer" && user.role === "dealer" && user.status !== "approved") {
    return (
      <div className="container-x py-20 max-w-2xl">
        <div className="swiss-card p-8">
          <div className="swiss-label text-[#E63946]">Status</div>
          <h2 className="font-display text-3xl font-bold mt-2">Konto wird geprüft</h2>
          <p className="text-gray-600 mt-3">Dein Händler-Konto wartet auf Freigabe durch unser Admin-Team. Du wirst informiert, sobald dein Konto freigeschaltet ist.</p>
        </div>
      </div>
    );
  }
  return children;
}
