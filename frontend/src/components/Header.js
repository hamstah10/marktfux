import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { useCompare } from "@/hooks/useCompare";
import { LogIn, LayoutDashboard, ShieldCheck, LogOut, UserPlus, Heart, GitCompareArrows, Zap } from "lucide-react";
import Logo from "./Logo";

export default function Header() {
  const { user, logout } = useAuth();
  const { count: favCount } = useFavorites();
  const { count: cmpCount } = useCompare();
  const nav = useNavigate();
  const onLogout = () => { logout(); nav("/"); };

  return (
    <header className="bg-[var(--card)] border-b border-[var(--hairline)]">
      <div className="page-wrap flex items-center justify-between h-[72px]">
        <Link to="/" data-testid="logo-link" className="block">
          <Logo size="md" />
        </Link>

        <nav className="flex items-center gap-1 md:gap-2">
          <NavLink to="/fahrzeuge" data-testid="nav-marketplace" className={({isActive}) => `font-display font-semibold text-[14px] px-3 py-2-[var(--radius-md)] transition-colors ${isActive ? "text-[var(--green)] bg-[var(--green-subtle)]" : "text-[var(--fg2)] hover:text-[var(--fg1)] hover:bg-[var(--muted-fill)]"}`}>
            Fahrzeuge
          </NavLink>
          <NavBadgeLink to="/vergleich" testid="nav-compare" icon={GitCompareArrows} label="Vergleich" count={cmpCount} badgeTestid="compare-count" />
          <NavBadgeLink to="/favoriten" testid="nav-favorites" icon={Heart} label="Merkliste" count={favCount} filled badgeTestid="favorites-count" />

          {!user && (
            <>
              <Link to="/login" data-testid="nav-login" className="hidden md:inline-flex items-center gap-2 font-display font-semibold text-[14px] text-[var(--fg2)] hover:text-[var(--fg1)] px-3 py-2-[var(--radius-md)] hover:bg-[var(--muted-fill)] transition-colors">
                <LogIn className="w-4 h-4" /> Login
              </Link>
              <Link to="/register" data-testid="nav-register" className="btn btn-primary btn-sm ml-1">
                <Zap className="w-3.5 h-3.5" /> Inserat aufgeben
              </Link>
            </>
          )}
          {user && user.role === "dealer" && (
            <Link to="/dashboard" data-testid="nav-dashboard" className="hidden md:inline-flex items-center gap-2 font-display font-semibold text-[14px] text-[var(--fg2)] hover:text-[var(--fg1)] px-3 py-2-[var(--radius-md)] hover:bg-[var(--muted-fill)] transition-colors">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
          )}
          {user && user.role === "admin" && (
            <Link to="/admin" data-testid="nav-admin" className="hidden md:inline-flex items-center gap-2 font-display font-semibold text-[14px] text-[var(--fg2)] hover:text-[var(--fg1)] px-3 py-2-[var(--radius-md)] hover:bg-[var(--muted-fill)] transition-colors">
              <ShieldCheck className="w-4 h-4" /> Admin
            </Link>
          )}
          {user && (
            <button data-testid="logout-btn" onClick={onLogout} className="inline-flex items-center gap-2 font-display font-semibold text-[14px] text-[var(--fg2)] hover:text-[var(--green)] px-3 py-2-[var(--radius-md)] hover:bg-[var(--muted-fill)] transition-colors">
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
    <NavLink to={to} data-testid={testid} className={({isActive}) => `relative inline-flex items-center gap-1.5 px-3 py-2-[var(--radius-md)] font-display font-semibold text-[14px] transition-colors ${isActive ? "text-[var(--green)] bg-[var(--green-subtle)]" : "text-[var(--fg2)] hover:text-[var(--fg1)] hover:bg-[var(--muted-fill)]"}`} title={label}>
      <Icon className="w-4 h-4" fill={filled && count > 0 ? "currentColor" : "none"} />
      <span className="hidden md:inline">{label}</span>
      {count > 0 && (
        <span data-testid={badgeTestid} className="ml-0.5 min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-[var(--green)] text-white inline-flex items-center justify-center font-body">{count}</span>
      )}
    </NavLink>
  );
}
