import { useEffect, useState, useCallback } from "react";

const KEY = "am_compare";
const MAX = 3;

function read() {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function write(arr) {
  localStorage.setItem(KEY, JSON.stringify(arr));
  window.dispatchEvent(new Event("am-compare-changed"));
}

export function useCompare() {
  const [items, setItems] = useState(() => read());

  useEffect(() => {
    const handler = () => setItems(read());
    window.addEventListener("am-compare-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("am-compare-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const isInCompare = useCallback((id) => items.includes(id), [items]);
  const canAdd = items.length < MAX;

  const toggle = useCallback((id) => {
    const curr = read();
    if (curr.includes(id)) {
      write(curr.filter((x) => x !== id));
      return { added: false, full: false };
    }
    if (curr.length >= MAX) {
      return { added: false, full: true };
    }
    write([...curr, id]);
    return { added: true, full: false };
  }, []);

  const remove = useCallback((id) => write(read().filter((x) => x !== id)), []);
  const clear = useCallback(() => write([]), []);

  return { items, isInCompare, canAdd, toggle, remove, clear, count: items.length, max: MAX };
}
