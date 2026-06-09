import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import CarCard from "@/components/CarCard";
import { SlidersHorizontal, Search } from "lucide-react";

const SORTS = [
  { v: "newest", l: "Neueste zuerst" },
  { v: "price_asc", l: "Preis aufsteigend" },
  { v: "price_desc", l: "Preis absteigend" },
  { v: "year_desc", l: "Baujahr (neu → alt)" },
  { v: "mileage_asc", l: "Kilometer aufsteigend" },
];

export default function Marketplace() {
  const [sp, setSp] = useSearchParams();
  const [facets, setFacets] = useState({ brands: [], fuels: [], transmissions: [] });
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: sp.get("search") || "",
    brand: sp.get("brand") || "",
    fuel: sp.get("fuel") || "",
    transmission: sp.get("transmission") || "",
    min_price: sp.get("min_price") || "",
    max_price: sp.get("max_price") || "",
    min_year: sp.get("min_year") || "",
    max_year: sp.get("max_year") || "",
    max_mileage: sp.get("max_mileage") || "",
    location: sp.get("location") || "",
    sort: sp.get("sort") || "newest",
  });

  useEffect(() => {
    api.get("/vehicles/facets").then((r) => setFacets(r.data)).catch(() => {});
  }, []);

  const params = useMemo(() => {
    const p = {};
    Object.entries(filters).forEach(([k, v]) => { if (v !== "" && v !== null) p[k] = v; });
    return p;
  }, [filters]);

  useEffect(() => {
    setLoading(true);
    api.get("/vehicles", { params }).then((r) => {
      setItems(r.data.items || []);
      setTotal(r.data.total || 0);
    }).finally(() => setLoading(false));
    const next = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => next.set(k, v));
    setSp(next, { replace: true });
  }, [params]);  // eslint-disable-line

  const upd = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
  const reset = () => setFilters({ search: "", brand: "", fuel: "", transmission: "", min_price: "", max_price: "", min_year: "", max_year: "", max_mileage: "", location: "", sort: "newest" });

  return (
    <div className="container-x py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="swiss-label text-[#E63946]">Marktplatz</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-2">Fahrzeuge entdecken</h1>
          <p className="text-sm text-gray-500 mt-1">{total} {total === 1 ? "Treffer" : "Treffer"}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              data-testid="filter-search-input"
              value={filters.search}
              onChange={(e) => upd("search", e.target.value)}
              placeholder="Suche..."
              className="pl-9 pr-3 py-2.5 border border-gray-200 outline-none focus:border-[#E63946] w-64 text-sm"
            />
          </div>
          <select data-testid="filter-sort" value={filters.sort} onChange={(e) => upd("sort", e.target.value)} className="border border-gray-200 py-2.5 px-3 text-sm outline-none focus:border-[#E63946]">
            {SORTS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 swiss-label">
              <SlidersHorizontal className="w-4 h-4" /> Filter
            </div>
            <button data-testid="filter-reset" onClick={reset} className="text-xs text-gray-500 hover:text-[#E63946] underline">Zurücksetzen</button>
          </div>

          <FilterBlock label="Marke">
            <select data-testid="filter-brand" value={filters.brand} onChange={(e) => upd("brand", e.target.value)} className="w-full border border-gray-200 py-2 px-3 text-sm">
              <option value="">Alle Marken</option>
              {facets.brands.map(b => <option key={b.name} value={b.name}>{b.name} ({b.count})</option>)}
            </select>
          </FilterBlock>

          <FilterBlock label="Preis €">
            <div className="grid grid-cols-2 gap-2">
              <input data-testid="filter-min-price" value={filters.min_price} onChange={(e) => upd("min_price", e.target.value)} type="number" placeholder="Von" className="border border-gray-200 py-2 px-3 text-sm" />
              <input data-testid="filter-max-price" value={filters.max_price} onChange={(e) => upd("max_price", e.target.value)} type="number" placeholder="Bis" className="border border-gray-200 py-2 px-3 text-sm" />
            </div>
          </FilterBlock>

          <FilterBlock label="Baujahr">
            <div className="grid grid-cols-2 gap-2">
              <input data-testid="filter-min-year" value={filters.min_year} onChange={(e) => upd("min_year", e.target.value)} type="number" placeholder="Von" className="border border-gray-200 py-2 px-3 text-sm" />
              <input data-testid="filter-max-year" value={filters.max_year} onChange={(e) => upd("max_year", e.target.value)} type="number" placeholder="Bis" className="border border-gray-200 py-2 px-3 text-sm" />
            </div>
          </FilterBlock>

          <FilterBlock label="Max. Kilometer">
            <input data-testid="filter-max-km" value={filters.max_mileage} onChange={(e) => upd("max_mileage", e.target.value)} type="number" placeholder="z.B. 100000" className="w-full border border-gray-200 py-2 px-3 text-sm" />
          </FilterBlock>

          <FilterBlock label="Kraftstoff">
            <select data-testid="filter-fuel" value={filters.fuel} onChange={(e) => upd("fuel", e.target.value)} className="w-full border border-gray-200 py-2 px-3 text-sm">
              <option value="">Alle</option>
              {facets.fuels.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </FilterBlock>

          <FilterBlock label="Getriebe">
            <select data-testid="filter-trans" value={filters.transmission} onChange={(e) => upd("transmission", e.target.value)} className="w-full border border-gray-200 py-2 px-3 text-sm">
              <option value="">Alle</option>
              {facets.transmissions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FilterBlock>

          <FilterBlock label="Standort">
            <input data-testid="filter-location" value={filters.location} onChange={(e) => upd("location", e.target.value)} placeholder="Stadt..." className="w-full border border-gray-200 py-2 px-3 text-sm" />
          </FilterBlock>
        </aside>

        {/* Grid */}
        <section>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <div key={i} className="swiss-card aspect-[4/3] animate-pulse bg-gray-100" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="swiss-card p-12 text-center" data-testid="empty-results">
              <p className="text-gray-500">Keine Fahrzeuge gefunden.</p>
              <button onClick={reset} className="swiss-btn-secondary mt-6">Filter zurücksetzen</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {items.map(v => <CarCard key={v.id} v={v} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function FilterBlock({ label, children }) {
  return (
    <div>
      <div className="swiss-label mb-2">{label}</div>
      {children}
    </div>
  );
}
