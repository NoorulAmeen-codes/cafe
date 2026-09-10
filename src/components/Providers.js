'use client';

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

const CART_KEY = 'acc_cart_v1';

export function Providers({ children, initialSettings }) {
  const [settings, setSettings] = useState(initialSettings || {});
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [carousels, setCarousels] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [user, setUser] = useState(null);
  const [pendingReview, setPendingReview] = useState(null);
  const [cart, setCart] = useState({});
  const [ready, setReady] = useState(false);
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, kind = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/bootstrap', { cache: 'no-store' });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Could not load the shop');
      setSettings(data.settings);
      setProducts(data.products);
      setCategories(data.categories);
      setCarousels(data.carousels);
      setReviews(data.reviews);
      setUser(data.user);
      setPendingReview(data.pendingReview);
    } catch (err) {
      fetch('/api/log', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Bootstrap failed: ' + err.message, url: location.pathname }),
      }).catch(() => {});
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.register('/sw.js').catch(() => {});
}, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) setCart(JSON.parse(raw));
    } catch {}
    refresh();

    const onError = (e) => {
      fetch('/api/log', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: e.message || 'Unhandled client error',
          detail: e.error?.stack || String(e.reason || ''),
          url: location.pathname,
        }),
      }).catch(() => {});
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onError);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onError);
    };
  }, [refresh]);

  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {}
  }, [cart]);

  const setQty = useCallback((productId, qty) => {
    setCart((c) => {
      const next = { ...c };
      if (qty <= 0) delete next[productId];
      else next[productId] = qty;
      return next;
    });
  }, []);

  const addToCart = useCallback((product, qty = 1) => {
    setCart((c) => {
      const current = c[product.id] || 0;
      const max = product.track_stock ? product.stock : 99;
      const next = Math.min(current + qty, Math.max(0, max));
      if (next === current) return c;
      return { ...c, [product.id]: next };
    });
  }, []);

  const clearCart = useCallback(() => setCart({}), []);

  const cartLines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => {
          const product = products.find((p) => String(p.id) === String(id));
          return product ? { ...product, qty, lineTotal: product.price * qty } : null;
        })
        .filter(Boolean),
    [cart, products]
  );

  const subtotal = cartLines.reduce((s, l) => s + l.lineTotal, 0);
  const cartCount = cartLines.reduce((s, l) => s + l.qty, 0);

  const value = {
    settings, products, categories, carousels, reviews, user, setUser, pendingReview,
    setPendingReview, cart, setQty, addToCart, clearCart, cartLines, subtotal, cartCount,
    ready, refresh, toast,
    shop: settings.shop || {},
    delivery: settings.delivery || {},
    payments: settings.payments || {},
    layout: settings.layout || { sections: [] },
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
      <div className="toast-host">
        {toasts.map((t) => (
          <div key={t.id} className={'toast' + (t.kind === 'err' ? ' err' : '')}>{t.message}</div>
        ))}
      </div>
    </StoreContext.Provider>
  );
}

export async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({ ok: false, error: 'Bad server response' }));
  if (!res.ok || !data.ok) throw new Error(data.error || 'Request failed');
  return data;
}
