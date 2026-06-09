import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Car, LogIn, LayoutDashboard, ShieldCheck, LogOut, UserPlus } from "lucide-react";

export default function Header() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const onLogout = () => {
    logout();
    nav("/");
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="container-x flex items-center justify-between h-16">
        <Link to="/" data-testid="logo-link" className="flex items-center gap-2 font-display font-extrabold text-xl tracking-tight">
          <Car className="w-6 h-6 text-[#E63946]" />
          <span>AUTO<span className="text-[#E63946]">MARKT</span></span>
        </Link>
        <nav className="flex items-center gap-1 md:gap-4">
          <NavLink to="/fahrzeuge" data-testid="nav-marketplace" className={({isActive}) => `swiss-label px-3 py-2 ${isActive ? "text-[#E63946]" : "text-gray-700 hover:text-[#0A0A0A]"}`}>
            Fahrzeuge
          </NavLink>
          {!user && (
            <>
              <Link to="/login" data-testid="nav-login" className="hidden md:inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-[#0A0A0A] px-3 py-2">
                <LogIn className="w-4 h-4" /> Login
              </Link>
              <Link to="/register" data-testid="nav-register" className="swiss-btn-primary text-sm py-2 px-4">
                <UserPlus className="w-4 h-4" /> Händler werden
              </Link>
            </>
          )}
          {user && user.role === "dealer" && (
            <Link to="/dashboard" data-testid="nav-dashboard" className="hidden md:inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-[#0A0A0A] px-3 py-2">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
          )}
          {user && user.role === "admin" && (
            <Link to="/admin" data-testid="nav-admin" className="hidden md:inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-[#0A0A0A] px-3 py-2">
              <ShieldCheck className="w-4 h-4" /> Admin
            </Link>
          )}
          {user && (
            <button data-testid="logout-btn" onClick={onLogout} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-[#E63946] px-3 py-2">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
