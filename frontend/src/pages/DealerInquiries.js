import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Mail, Phone, CheckCircle2 } from "lucide-react";

export default function DealerInquiries() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null);

  const reload = () => {
    setLoading(true);
    api.get("/dealer/inquiries").then(r => setItems(r.data.items || [])).finally(() => setLoading(false));
  };
  useEffect(() => { reload(); }, []);

  const markRead = async (id) => {
    await api.patch(`/dealer/inquiries/${id}/read`);
    reload();
  };

  if (loading) return <div className="text-gray-500">Lade…</div>;
  if (items.length === 0) return <div className="swiss-card p-10 text-center text-gray-500" data-testid="empty-inquiries">Noch keine Anfragen.</div>;

  return (
    <div className="space-y-3" data-testid="dealer-inquiries-list">
      {items.map(i => (
        <div key={i.id} className={`swiss-card p-5 ${!i.read ? "border-l-4 border-l-[#16A34A]" : ""}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{i.name}</span>
                {!i.read && <span className="text-xs font-bold uppercase tracking-wider text-[#16A34A]">Neu</span>}
              </div>
              <div className="text-xs text-gray-500 mt-1">zu: <span className="font-semibold text-gray-700">{i.vehicle_title}</span></div>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {i.email}</span>
                {i.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {i.phone}</span>}
              </div>
              <button onClick={() => setOpen(open === i.id ? null : i.id)} className="text-sm text-[#16A34A] font-semibold mt-2">{open === i.id ? "Ausblenden" : "Nachricht anzeigen"}</button>
              {open === i.id && (
                <div className="mt-3 bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-wrap border-l-2 border-gray-300">{i.message}</div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-xs text-gray-400">{new Date(i.created_at).toLocaleDateString("de-DE")}</div>
              {!i.read && (
                <button data-testid={`mark-read-${i.id}`} onClick={() => markRead(i.id)} className="text-xs inline-flex items-center gap-1 text-gray-600 hover:text-[#16A34A]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Als gelesen
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
