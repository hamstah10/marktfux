import { useEffect, useState, useCallback } from "react";

const KEY = "am_favorites";

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(arr) {
  localStorage.setItem(KEY, JSON.stringify(arr));
  window.dispatchEvent(new Event("am-favorites-changed"));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState(() => read());

  useEffect(() => {
    const handler = () => setFavorites(read());
    window.addEventListener("am-favorites-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("am-favorites-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const isFav = useCallback((id) => favorites.includes(id), [favorites]);

  const toggle = useCallback((id) => {
    const curr = read();
    const next = curr.includes(id) ? curr.filter((x) => x !== id) : [id, ...curr];
    write(next);
  }, []);

  const remove = useCallback((id) => {
    const next = read().filter((x) => x !== id);
    write(next);
  }, []);

  return { favorites, isFav, toggle, remove, count: favorites.length };
}
