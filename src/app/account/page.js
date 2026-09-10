'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SiteChrome from '@/components/SiteChrome';
import MapView from '@/components/MapView';
import { useStore, apiFetch } from '@/components/Providers';
import { Icon, Stars, GoogleG, WhatsAppIcon } from '@/components/Icon';

const STATUS_LABEL = {
  placed: 'Waiting for confirmation', approved: 'Approved by the bakery', baking: 'In the oven',
  ready: 'Ready for pickup', out_for_delivery: 'Out for delivery', delivered: 'Delivered', cancelled: 'Cancelled',
};

export default function AccountPage() {
  const { user, setUser, ready, shop, refresh, toast } = useStore();
  const router = useRouter();
  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewFor, setReviewFor] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch('/api/orders');
      setOrders(res.orders);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
  let cancelled = false;

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'GET',
        cache: 'no-store',
      });

      const data = await res.json();

      if (cancelled) return;

      if (!data.ok || !data.user) {
        setUser(null);
        router.replace('/login?next=%2Faccount');
        return;
      }

      setUser(data.user);
    } catch {
      if (!cancelled) {
        setUser(null);
        router.replace('/login?next=%2Faccount');
      }
    } finally {
      if (!cancelled) setAuthChecking(false);
    }
  };

  checkSession();

  return () => {
    cancelled = true;
  };
}, [router, setUser]);

  useEffect(() => {
  if (authChecking || !user) return;
  load();
}, [authChecking, user, load]);

  useEffect(() => {
  const handlePageShow = (event) => {
    // If the browser restored this page from its back/forward cache,
    // force a completely fresh request.
    if (event.persisted) {
      window.location.reload();
    }
  };

  window.addEventListener('pageshow', handlePageShow);

  return () => {
    window.removeEventListener('pageshow', handlePageShow);
  };
}, []);

  const stats = useMemo(() => {
    const active = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status));
    const paid = orders.filter((o) => o.payment_status === 'paid').reduce((s, o) => s + o.total, 0);
    const due = orders.filter((o) => o.payment_status === 'pending' && o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
    return { total: orders.length, active: active.length, paid, due };
  }, [orders]);

  const cancel = async (order) => {
    if (!confirm(`Cancel order ${order.code}?`)) return;
    try {
      await apiFetch(`/api/orders/${order.id}`, { method: 'PATCH', body: { action: 'cancel' } });
      toast('Order cancelled');
      load(); refresh();
    } catch (e) { toast(e.message, 'err'); }
  };

  if (!ready || authChecking || !user) {
  return (
    <SiteChrome>
      <div className="wrap section center muted">
        Loading your dashboard…
      </div>
    </SiteChrome>
  );
}

  return (
    <SiteChrome>
      <section className="wrap section">
        <div className="row-between wrap-gap">
          <div>
            <div className="eyebrow">My account</div>
            <h1>Hi {(user.name || 'there').split(' ')[0]} 👋</h1>
            <p className="muted small" style={{ marginTop: 6 }}>
              {user.phone} · {user.email}
            </p>
          </div>
         <button
            className="btn btn-ghost btn-sm"
            onClick={async () => {
              try {
                const res = await fetch('/api/auth/login', {
                  method: 'DELETE',
                  cache: 'no-store',
                });

                if (!res.ok) {
                  throw new Error('Logout failed');
                }

                setUser(null);

                router.replace('/');

                setTimeout(() => {
                  router.refresh();
                }, 100);
              } catch (e) {
                console.error('Logout failed:', e);
              }
            }}
          >
            <Icon name="logout" size={15} /> Sign out
          </button>
        </div>

        <div className="grid grid-4" style={{ marginTop: 20 }}>
          <div className="stat"><div className="k">Total orders</div><div className="v">{stats.total}</div></div>
          <div className="stat"><div className="k">In progress</div><div className="v">{stats.active}</div></div>
          <div className="stat"><div className="k">Paid so far</div><div className="v">₹{stats.paid}</div></div>
          <div className="stat"><div className="k">Amount due</div><div className="v">₹{stats.due}</div></div>
        </div>

        <div className="row wrap-gap" style={{ margin: '24px 0 16px' }}>
          {[['orders', 'Orders'], ['payments', 'Payments'], ['profile', 'Address & profile']].map(([k, l]) => (
            <button key={k} className={'chip' + (tab === k ? ' active' : '')} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {tab === 'orders' && (
          <div className="stack">
            {loading && <p className="muted">Loading orders…</p>}
            {!loading && orders.length === 0 && (
              <div className="card pad center" style={{ padding: 46 }}>
                <div style={{ fontSize: 40 }}>🍩</div>
                <h3 style={{ marginTop: 10 }}>No orders yet</h3>
                <p className="muted small">Your first bake is waiting.</p>
                <Link className="btn" style={{ marginTop: 16 }} href="/menu">Browse the menu</Link>
              </div>
            )}

            {orders.map((o) => (
              <div key={o.id} className="card pad">
                <div className="row-between wrap-gap">
                  <div>
                    <div className="row" style={{ gap: 10 }}>
                      <b>{o.code}</b>
                      <span className={'status status-' + o.status}>{STATUS_LABEL[o.status] || o.status}</span>
                      {o.kind === 'custom' && <span className="tag tag-eggless">Custom cake</span>}
                    </div>
                    <div className="tiny muted" style={{ marginTop: 4 }}>
                      {new Date(o.created_at + 'Z').toLocaleString('en-IN')} · {o.fulfilment === 'pickup' ? 'Pickup' : `Delivery${o.distance_km ? ` · ${o.distance_km} km` : ''}`}
                    </div>
                  </div>
                  <div className="row" style={{ gap: 10 }}>
                    <span className="price">₹{o.total}</span>
                    <span className={'tag ' + (o.payment_status === 'paid' ? 'tag-veg' : 'tag-plain')}>
                      {o.payment_status === 'paid' ? 'Paid' : 'Pay on handover'}
                    </span>
                  </div>
                </div>

                {o.items.length > 0 && (
                  <div className="row wrap-gap" style={{ marginTop: 14, gap: 10 }}>
                    {o.items.map((it) => (
                      <span key={it.id} className="row card" style={{ gap: 8, padding: 8, boxShadow: 'none' }}>
                        <img src={it.image} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover' }} />
                        <span className="tiny"><b>{it.name}</b> × {it.qty}</span>
                      </span>
                    ))}
                  </div>
                )}

                {o.customization && (
                  <div className="highlight-box" style={{ marginTop: 14 }}>
                    <b className="small">Customisation</b>
                    <div className="row wrap-gap tiny" style={{ marginTop: 8, gap: 8 }}>
                      {Object.entries(safeParse(o.customization)).filter(([, v]) => v !== '' && v !== false).map(([k, v]) => (
                        <span key={k} className="chip tiny" style={{ padding: '4px 10px' }}>
                          {k.replace(/_/g, ' ')}: <b>{String(v)}</b>
                        </span>
                      ))}
                    </div>
                    {o.reference_image && (
                      <a href={o.reference_image} target="_blank" rel="noreferrer">
                        <img src={o.reference_image} alt="Reference" style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 10, marginTop: 10 }} />
                      </a>
                    )}
                  </div>
                )}

                {o.events?.length > 0 && (
                  <div className="row wrap-gap" style={{ marginTop: 14, gap: 6 }}>
                    {o.events.map((e, i) => (
                      <span key={i} className="tiny muted">
                        {i > 0 && '→ '}
                        <b style={{ textTransform: 'capitalize' }}>{e.status.replace(/_/g, ' ')}</b>
                      </span>
                    ))}
                  </div>
                )}

                <div className="row wrap-gap" style={{ marginTop: 14, gap: 10 }}>
                  {['placed', 'approved'].includes(o.status) && (
                    <button className="btn btn-ghost btn-sm" onClick={() => cancel(o)}>Cancel order</button>
                  )}
                  {o.status === 'delivered' && !o.reviewed && (
                    <button className="btn btn-sm" onClick={() => setReviewFor(o)}>Rate this order</button>
                  )}
                  {o.status === 'delivered' && !!o.reviewed && (
                    <a className="btn btn-ghost btn-sm" href={shop.google_review_url} target="_blank" rel="noreferrer">
                      <GoogleG size={14} /> Review on Google
                    </a>
                  )}
                  <a className="btn btn-ghost btn-sm"
                     href={`https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(`Hi, about my order ${o.code}…`)}`}
                     target="_blank" rel="noreferrer">
                    <WhatsAppIcon size={14} /> Ask about this order
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'payments' && (
          <div className="card pad" style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr><th>Order</th><th>Date</th><th>Method</th><th>Status</th><th style={{ textAlign: 'right' }}>Amount</th></tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td><b>{o.code}</b><div className="tiny muted">{o.kind === 'custom' ? 'Custom cake' : `${o.items.length} items`}</div></td>
                    <td className="small">{new Date(o.created_at + 'Z').toLocaleDateString('en-IN')}</td>
                    <td className="small">{o.payment_method === 'cod' ? 'Cash / UPI on handover' : 'Razorpay'}</td>
                    <td><span className={'status ' + (o.payment_status === 'paid' ? 'status-delivered' : 'status-placed')}>{o.payment_status}</span></td>
                    <td style={{ textAlign: 'right' }}><b>₹{o.total}</b></td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td colSpan={5} className="muted center">No payments yet</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'profile' && <ProfileTab />}
      </section>

      {reviewFor && (
        <RateModal order={reviewFor} onClose={() => { setReviewFor(null); load(); refresh(); }} />
      )}
    </SiteChrome>
  );
}

function safeParse(s) {
  if (!s) return {};
  if (typeof s === 'object') return s;
  try { return JSON.parse(s); } catch { return { note: s }; }
}

function ProfileTab() {
  const { user, setUser, shop, delivery, toast } = useStore();
  const [form, setForm] = useState({ ...user });
  const [pin, setPin] = useState(user.lat != null ? { lat: user.lat, lng: user.lng } : null);
  const [quote, setQuote] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/api/quote', { method: 'POST', body: { pincode: form.pincode, lat: pin?.lat, lng: pin?.lng } });
        setQuote(res.quote);
      } catch {}
    })();
  }, [form.pincode, pin]);

  const save = async () => {
    setBusy(true);
    try {
      const res = await apiFetch('/api/auth/me', { method: 'PUT', body: { ...form, lat: pin?.lat, lng: pin?.lng } });
      setUser(res.user);
      toast('Address updated');
    } catch (e) { toast(e.message, 'err'); } finally { setBusy(false); }
  };

  return (
    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
      <div className="card pad stack">
        <b>Your details</b>
        <label className="field">Name<input className="input" value={form.name || ''} onChange={set('name')} /></label>
        <div className="form-grid">
          <label className="field">Phone<input className="input" value={form.phone || ''} disabled /></label>
          <label className="field">Email<input className="input" value={form.email || ''} disabled /></label>
        </div>
        <div className="form-grid">
          <label className="field">Pincode<input className="input" value={form.pincode || ''} onChange={set('pincode')} maxLength={6} /></label>
          <label className="field">State<input className="input" value={form.state || ''} onChange={set('state')} /></label>
        </div>
        <div className="form-grid">
          <label className="field">District<input className="input" value={form.district || ''} onChange={set('district')} /></label>
          <label className="field">City<input className="input" value={form.city || ''} onChange={set('city')} /></label>
        </div>
        <label className="field">Locality<input className="input" value={form.locality || ''} onChange={set('locality')} /></label>
        <label className="field">House / street<input className="input" value={form.address_line || ''} onChange={set('address_line')} /></label>
        <button className="btn" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
      </div>

      <div className="card pad">
        <b>Delivery check</b>
        <p className="tiny muted" style={{ margin: '6px 0 12px' }}>Drag the pin to your gate — we use it to work out the delivery distance and charge.</p>
        <MapView lat={Number(shop.lat)} lng={Number(shop.lng)} zoom={12} radiusKm={delivery.radius_km} height={260} draggable pin={pin} onPinChange={setPin} />
        {quote && (
          <div className={'alert ' + (quote.in_range ? 'alert-ok' : 'alert-warn')} style={{ marginTop: 12 }}>
            {quote.in_range
              ? `You are ${quote.distance_km} km away — inside our ${quote.radius_km} km delivery circle. Charge ₹${quote.charge}.`
              : quote.reason}
          </div>
        )}
      </div>
    </div>
  );
}

function RateModal({ order, onClose }) {
  const { shop, toast } = useStore();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const res = await apiFetch(`/api/orders/${order.id}/review`, { method: 'POST', body: { rating, text } });
      setDone(true);
      if (rating >= 4 && res.google_review_url) window.open(res.google_review_url, '_blank', 'noopener');
      toast('Thanks for the review!');
    } catch (e) { toast(e.message, 'err'); } finally { setBusy(false); }
  };

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal pad" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        {!done ? (
          <>
            <h3>Rate order {order.code}</h3>
            <div className="row" style={{ gap: 6, margin: '16px 0', justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)} style={{ border: 'none', background: 'none', fontSize: 30, cursor: 'pointer', opacity: n <= rating ? 1 : 0.3 }}>⭐</button>
              ))}
            </div>
            <textarea className="input" placeholder="What did you think?" value={text} onChange={(e) => setText(e.target.value)} />
            <div className="row" style={{ marginTop: 14, gap: 10 }}>
              <button className="btn grow" onClick={submit} disabled={busy}>{busy ? 'Sending…' : 'Submit'}</button>
              <button className="btn btn-ghost" onClick={onClose}>Later</button>
            </div>
          </>
        ) : (
          <div className="center">
            <div style={{ fontSize: 40 }}>🎉</div>
            <h3 style={{ marginTop: 8 }}>Thank you!</h3>
            <a className="btn btn-ghost" style={{ marginTop: 14 }} href={shop.google_review_url} target="_blank" rel="noreferrer">
              <GoogleG /> Post it on Google
            </a>
            <div><button className="link tiny" style={{ marginTop: 12 }} onClick={onClose}>Close</button></div>
          </div>
        )}
      </div>
    </div>
  );
}
