import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import CarCard from "@/components/CarCard";
import { StaggerItem } from "@/components/Motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal, Search, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 12;
const SORTS = [
  { v: "newest", l: "Neueste zuerst" },
  { v: "price_asc", l: "Preis aufsteigend" },
  { v: "price_desc", l: "Preis absteigend" },
  { v: "year_desc", l: "Baujahr (neu → alt)" },
  { v: "year_asc", l: "Baujahr (alt → neu)" },
  { v: "mileage_asc", l: "Kilometer aufsteigend" },
];

const ALL = "__all__";

export default function Marketplace() {
  const [sp, setSp] = useSearchParams();
  const [facets, setFacets] = useState({ brands: [], fuels: [], transmissions: [] });
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(parseInt(sp.get("page") || "1", 10));
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
    const skip = (page - 1) * PAGE_SIZE;
    api.get("/vehicles", { params: { ...params, skip, limit: PAGE_SIZE } }).then((r) => {
      setItems(r.data.items || []);
      setTotal(r.data.total || 0);
    }).finally(() => setLoading(false));
    const next = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => next.set(k, v));
    if (page > 1) next.set("page", String(page));
    setSp(next, { replace: true });
  }, [params, page]);  // eslint-disable-line

  const upd = (k, v) => { setFilters((f) => ({ ...f, [k]: v })); setPage(1); };
  const reset = () => { setFilters({ search: "", brand: "", fuel: "", transmission: "", min_price: "", max_price: "", min_year: "", max_year: "", max_mileage: "", location: "", sort: "newest" }); setPage(1); };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showingFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="container-x py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="swiss-label text-[#E63946]">Marktplatz</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-2">Fahrzeuge entdecken</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total === 0 ? "0 Treffer" : <>Zeige <span className="font-semibold text-gray-700">{showingFrom}–{showingTo}</span> von <span className="font-semibold text-gray-700">{total}</span></>}
          </p>
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
          <div className="w-56">
            <Select value={filters.sort} onValueChange={(v) => upd("sort", v)}>
              <SelectTrigger data-testid="filter-sort" className="rounded-none border-gray-200 h-[42px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                {SORTS.map(s => <SelectItem key={s.v} value={s.v} className="rounded-none">{s.l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
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
            <Select value={filters.brand || ALL} onValueChange={(v) => upd("brand", v === ALL ? "" : v)}>
              <SelectTrigger data-testid="filter-brand" className="rounded-none border-gray-200 h-10 text-sm">
                <SelectValue placeholder="Alle Marken" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value={ALL} className="rounded-none">Alle Marken</SelectItem>
                {facets.brands.map(b => <SelectItem key={b.name} value={b.name} className="rounded-none">{b.name} ({b.count})</SelectItem>)}
              </SelectContent>
            </Select>
          </FilterBlock>

          <FilterBlock label="Preis €">
            <div className="grid grid-cols-2 gap-2">
              <input data-testid="filter-min-price" value={filters.min_price} onChange={(e) => upd("min_price", e.target.value)} type="number" placeholder="Von" className={numInp} />
              <input data-testid="filter-max-price" value={filters.max_price} onChange={(e) => upd("max_price", e.target.value)} type="number" placeholder="Bis" className={numInp} />
            </div>
          </FilterBlock>

          <FilterBlock label="Baujahr">
            <div className="grid grid-cols-2 gap-2">
              <input data-testid="filter-min-year" value={filters.min_year} onChange={(e) => upd("min_year", e.target.value)} type="number" placeholder="Von" className={numInp} />
              <input data-testid="filter-max-year" value={filters.max_year} onChange={(e) => upd("max_year", e.target.value)} type="number" placeholder="Bis" className={numInp} />
            </div>
          </FilterBlock>

          <FilterBlock label="Max. Kilometer">
            <input data-testid="filter-max-km" value={filters.max_mileage} onChange={(e) => upd("max_mileage", e.target.value)} type="number" placeholder="z.B. 100000" className={numInp + " w-full"} />
          </FilterBlock>

          <FilterBlock label="Kraftstoff">
            <Select value={filters.fuel || ALL} onValueChange={(v) => upd("fuel", v === ALL ? "" : v)}>
              <SelectTrigger data-testid="filter-fuel" className="rounded-none border-gray-200 h-10 text-sm">
                <SelectValue placeholder="Alle" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value={ALL} className="rounded-none">Alle</SelectItem>
                {facets.fuels.map(f => <SelectItem key={f} value={f} className="rounded-none">{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </FilterBlock>

          <FilterBlock label="Getriebe">
            <Select value={filters.transmission || ALL} onValueChange={(v) => upd("transmission", v === ALL ? "" : v)}>
              <SelectTrigger data-testid="filter-trans" className="rounded-none border-gray-200 h-10 text-sm">
                <SelectValue placeholder="Alle" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value={ALL} className="rounded-none">Alle</SelectItem>
                {facets.transmissions.map(t => <SelectItem key={t} value={t} className="rounded-none">{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </FilterBlock>

          <FilterBlock label="Standort">
            <input data-testid="filter-location" value={filters.location} onChange={(e) => upd("location", e.target.value)} placeholder="Stadt..." className={numInp + " w-full"} />
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
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {items.map((v, i) => (
                  <StaggerItem key={v.id} index={i}>
                    <CarCard v={v} />
                  </StaggerItem>
                ))}
              </div>
              {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onChange }) {
  const pages = [];
  const window_ = 1;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - window_ && i <= page + window_)) pages.push(i);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  return (
    <nav className="mt-10 flex items-center justify-center gap-1" data-testid="pagination">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        data-testid="page-prev"
        className="inline-flex items-center gap-1 px-3 h-10 border border-gray-200 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        <ChevronLeft className="w-4 h-4" /> Zurück
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-2 text-gray-400">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            data-testid={`page-${p}`}
            className={`w-10 h-10 text-sm font-semibold border ${p === page ? "bg-[#0A0A0A] text-white border-[#0A0A0A]" : "border-gray-200 hover:bg-gray-50"}`}
          >
            {p}
          </button>
        )
      )}
      <button
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        data-testid="page-next"
        className="inline-flex items-center gap-1 px-3 h-10 border border-gray-200 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Weiter <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}

const numInp = "border border-gray-200 py-2 px-3 text-sm focus:border-[#E63946] outline-none";

function FilterBlock({ label, children }) {
  return (
    <div>
      <div className="swiss-label mb-2">{label}</div>
      {children}
    </div>
  );
}
