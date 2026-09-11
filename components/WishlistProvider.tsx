"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

const STORAGE_KEY = "okuhle_wishlist";

type WishlistContext = {
  items: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
  ready: boolean;
};

const Ctx = createContext<WishlistContext>({
  items: [],
  toggle: () => {},
  has: () => false,
  ready: false,
});

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // storage unavailable (private mode, blocked cookies) — wishlist just stays empty
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, ready]);

  const toggle = (id: string) =>
    setItems((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  return (
    <Ctx.Provider value={{ items, toggle, has: (id) => items.includes(id), ready }}>
      {children}
    </Ctx.Provider>
  );
}

export const useWishlist = () => useContext(Ctx);
