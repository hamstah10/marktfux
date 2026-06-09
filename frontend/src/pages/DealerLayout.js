import React, { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { LayoutGrid, Plus, MessagesSquare, BarChart3 } from "lucide-react";

export default function DealerLayout() {
  const { user } = useAuth();
  const loc = useLocation();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/dealer/stats").then(r => setStats(r.data)).catch(() => {});
  }, [loc.pathname]);

  return (
    <div className="container-x py-10">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="swiss-label text-[#E63946]">Händler-Dashboard</div>
          <h1 className="font-display text-3xl font-bold tracking-tight mt-2">Hallo, {user?.name?.split(" ")[0]}</h1>
        </div>
        <Link to="/dashboard/neu" data-testid="new-listing-btn" className="swiss-btn-primary"><Plus className="w-4 h-4" /> Neues Fahrzeug</Link>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard label="Inserate gesamt" value={stats.total_listings} />
          <StatCard label="Veröffentlicht" value={stats.published_listings} accent />
          <StatCard label="Anfragen gesamt" value={stats.total_inquiries} />
          <StatCard label="Ungelesen" value={stats.unread_inquiries} highlight={stats.unread_inquiries > 0} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10">
        <aside>
          <nav className="space-y-1">
            <SideLink to="/dashboard" end icon={LayoutGrid} label="Inserate" testid="dash-nav-listings" />
            <SideLink to="/dashboard/anfragen" icon={MessagesSquare} label="Anfragen" testid="dash-nav-inquiries" />
            <SideLink to="/dashboard/stats" icon={BarChart3} label="Analytics" testid="dash-nav-stats" />
          </nav>
        </aside>
        <section>
          <Outlet context={{ refreshStats: () => api.get("/dealer/stats").then(r => setStats(r.data)) }} />
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent, highlight }) {
  return (
    <div className={`swiss-card p-5 ${highlight ? "border-[#E63946] border-2" : ""}`}>
      <div className="swiss-label text-gray-500">{label}</div>
      <div className={`font-display font-extrabold text-3xl mt-2 ${accent ? "text-[#E63946]" : ""}`}>{value}</div>
    </div>
  );
}

function SideLink({ to, end, icon: Icon, label, testid }) {
  return (
    <NavLink end={end} to={to} data-testid={testid} className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 text-sm font-semibold border-l-4 transition-colors ${isActive ? "bg-gray-50 border-[#E63946] text-[#0A0A0A]" : "border-transparent text-gray-600 hover:text-[#0A0A0A] hover:bg-gray-50"}`
    }>
      <Icon className="w-4 h-4" /> {label}
    </NavLink>
  );
}
