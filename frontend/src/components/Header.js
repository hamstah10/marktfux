import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { useCompare } from "@/hooks/useCompare";
import { Car, LogIn, LayoutDashboard, ShieldCheck, LogOut, UserPlus, Heart, GitCompareArrows } from "lucide-react";

export default function Header() {
  const { user, logout } = useAuth();
  const { count: favCount } = useFavorites();
  const { count: cmpCount } = useCompare();
  const nav = useNavigate();
  const onLogout = () => { logout(); nav("/"); };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="container-x flex items-center justify-between h-16">
        <Link to="/" data-testid="logo-link" className="flex items-center gap-2 font-display font-extrabold text-xl tracking-tight">
          <Car className="w-6 h-6 text-[#E63946]" />
          <span>AUTO<span className="text-[#E63946]">MARKT</span></span>
        </Link>
        <nav className="flex items-center gap-1 md:gap-3">
          <NavLink to="/fahrzeuge" data-testid="nav-marketplace" className={({isActive}) => `swiss-label px-3 py-2 ${isActive ? "text-[#E63946]" : "text-gray-700 hover:text-[#0A0A0A]"}`}>
            Fahrzeuge
          </NavLink>
          <NavBadgeLink to="/vergleich" testid="nav-compare" icon={GitCompareArrows} label="Vergleich" count={cmpCount} badgeTestid="compare-count" />
          <NavBadgeLink to="/favoriten" testid="nav-favorites" icon={Heart} label="Merkliste" count={favCount} filled badgeTestid="favorites-count" />
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

function NavBadgeLink({ to, testid, icon: Icon, label, count, filled = false, badgeTestid }) {
  return (
    <NavLink to={to} data-testid={testid} className={({isActive}) => `relative inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold ${isActive ? "text-[#E63946]" : "text-gray-700 hover:text-[#0A0A0A]"}`} title={label}>
      <Icon className="w-4 h-4" fill={filled && count > 0 ? "currentColor" : "none"} />
      <span className="hidden md:inline">{label}</span>
      {count > 0 && (
        <span data-testid={badgeTestid} className="ml-0.5 min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-[#E63946] text-white inline-flex items-center justify-center">{count}</span>
      )}
    </NavLink>
  );
}
