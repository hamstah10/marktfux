import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";
import CarCard from "@/components/CarCard";
import { toast } from "sonner";
import { Star, Building2, Phone, MapPin, Calendar, ArrowLeft, Car as CarIcon, MessageSquarePlus } from "lucide-react";

function StarRow({ value = 0, size = "w-4 h-4", onChange }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type={onChange ? "button" : undefined}
          onClick={onChange ? () => onChange(i) : undefined}
          disabled={!onChange}
          className={onChange ? "transition-transform hover:scale-110" : "cursor-default"}
          aria-label={`${i} Sterne`}
        >
          <Star className={`${size} ${i <= value ? "fill-[#16A34A] text-[#16A34A]" : "text-gray-300"}`} />
        </button>
      ))}
    </div>
  );
}

export default function DealerProfile() {
  const { id } = useParams();
  const [dealer, setDealer] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", rating: 5, comment: "" });
  const [submitting, setSubmitting] = useState(false);

  const reloadReviews = () => api.get(`/dealers/${id}/reviews`).then(r => setReviews(r.data.items || []));
  const reloadDealer = () => api.get(`/dealers/${id}`).then(r => setDealer(r.data)).catch(() => setDealer(false));

  useEffect(() => {
    reloadDealer();
    api.get(`/dealers/${id}/vehicles`).then(r => setVehicles(r.data.items || []));
    reloadReviews();
    // eslint-disable-next-line
  }, [id]);

  const submit = async (e) => {
    e.preventDefault();
    if (form.comment.length < 10) { toast.error("Bitte mindestens 10 Zeichen Kommentar."); return; }
    setSubmitting(true);
    try {
      await api.post(`/dealers/${id}/reviews`, form);
      toast.success("Bewertung veröffentlicht!");
      setForm({ name: "", rating: 5, comment: "" });
      setShowForm(false);
      reloadReviews();
      reloadDealer();
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally { setSubmitting(false); }
  };

  if (dealer === false) return <div className="page-wrap py-20 text-center text-gray-500" data-testid="dealer-not-found">Händler nicht gefunden.</div>;
  if (!dealer) return <div className="page-wrap py-20 text-center text-gray-500">Lade…</div>;

  const memberSince = dealer.created_at ? new Date(dealer.created_at).getFullYear() : "—";

  return (
    <div>
      {/* Hero */}
      <section className="bg-[#0A0A0A] text-white">
        <div className="page-wrap py-16">
          <Link to="/fahrzeuge" className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="w-3.5 h-3.5" /> Marktplatz
          </Link>
          <div className="grid md:grid-cols-[1fr_auto] gap-8 items-end">
            <div>
              <div className="swiss-label text-[#16A34A]">Autohändler</div>
              <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight mt-3" data-testid="dealer-name">
                {dealer.company || dealer.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-6 text-sm text-gray-300">
                {dealer.company && <span className="flex items-center gap-2"><Building2 className="w-4 h-4 text-[#16A34A]" /> {dealer.name}</span>}
                {dealer.phone && <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#16A34A]" /> {dealer.phone}</span>}
                <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-[#16A34A]" /> Mitglied seit {memberSince}</span>
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end">
              <div className="flex items-center gap-3">
                <span className="font-display text-5xl font-extrabold leading-none" data-testid="dealer-rating-avg">{dealer.rating_count > 0 ? dealer.rating_avg.toFixed(1) : "—"}</span>
                <div>
                  <StarRow value={Math.round(dealer.rating_avg)} size="w-5 h-5" />
                  <div className="text-xs text-gray-400 mt-1" data-testid="dealer-rating-count">{dealer.rating_count} Bewertung{dealer.rating_count === 1 ? "" : "en"}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-3 uppercase tracking-widest">{dealer.vehicle_count} aktive Inserate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Vehicles */}
      <section className="page-wrap py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="swiss-label text-[#16A34A]">Fahrzeuge</div>
            <h2 className="font-display text-2xl md:text-3xl font-bold mt-2">Inserate dieses Händlers</h2>
          </div>
        </div>
        {vehicles.length === 0 ? (
          <div className="swiss-card p-10 text-center text-gray-500"><CarIcon className="w-8 h-8 mx-auto text-gray-300" /><p className="mt-3 text-sm">Aktuell keine veröffentlichten Inserate.</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="dealer-vehicles-grid">
            {vehicles.map(v => <CarCard key={v.id} v={v} />)}
          </div>
        )}
      </section>

      {/* Reviews */}
      <section className="bg-gray-50 border-t border-gray-200">
        <div className="page-wrap py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="swiss-label text-[#16A34A]">Bewertungen</div>
              <h2 className="font-display text-2xl md:text-3xl font-bold mt-2">Was Kunden sagen</h2>
            </div>
            {!showForm && (
              <button onClick={() => setShowForm(true)} data-testid="open-review-form" className="swiss-btn-primary">
                <MessageSquarePlus className="w-4 h-4" /> Bewertung schreiben
              </button>
            )}
          </div>

          {showForm && (
            <form onSubmit={submit} className="swiss-card p-6 mb-8 max-w-2xl" data-testid="review-form">
              <h3 className="font-display font-bold text-lg">Deine Bewertung</h3>
              <div className="mt-4">
                <label className="swiss-label">Sterne</label>
                <div className="mt-2"><StarRow value={form.rating} size="w-7 h-7" onChange={(r) => setForm({ ...form, rating: r })} /></div>
              </div>
              <div className="mt-4">
                <label className="swiss-label">Dein Name *</label>
                <input required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} data-testid="review-name" className="w-full mt-2 border border-gray-200 py-2.5 px-3 outline-none focus:border-[#16A34A] text-sm" />
              </div>
              <div className="mt-4">
                <label className="swiss-label">Kommentar * (min. 10 Zeichen)</label>
                <textarea required value={form.comment} onChange={(e) => setForm({...form, comment: e.target.value})} data-testid="review-comment" rows={4} className="w-full mt-2 border border-gray-200 py-2.5 px-3 outline-none focus:border-[#16A34A] text-sm" />
              </div>
              <div className="flex items-center justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowForm(false)} className="swiss-btn-secondary text-sm py-2 px-4">Abbrechen</button>
                <button type="submit" disabled={submitting} data-testid="review-submit" className="swiss-btn-primary text-sm py-2 px-4">{submitting ? "Sende…" : "Veröffentlichen"}</button>
              </div>
            </form>
          )}

          {reviews.length === 0 ? (
            <div className="swiss-card p-10 text-center text-gray-500"><p className="text-sm">Noch keine Bewertungen — sei der erste!</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5" data-testid="reviews-list">
              {reviews.map(r => (
                <div key={r.id} className="swiss-card p-5">
                  <div className="flex items-center justify-between">
                    <StarRow value={r.rating} />
                    <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString("de-DE")}</span>
                  </div>
                  <div className="font-semibold mt-3">{r.name}</div>
                  <p className="text-sm text-gray-700 mt-2 leading-relaxed whitespace-pre-wrap">{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
