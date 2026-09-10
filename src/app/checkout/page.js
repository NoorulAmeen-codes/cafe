'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SiteChrome from '@/components/SiteChrome';
import MapView from '@/components/MapView';
import { useStore, apiFetch } from '@/components/Providers';
import { Icon, WhatsAppIcon } from '@/components/Icon';

export default function CheckoutPage() {
  const { cartLines, subtotal, setQty, clearCart, user, shop, delivery, payments, ready, refresh, toast } = useStore();
  const router = useRouter();

  const [mode, setMode] = useState('pickup');
  const [quote, setQuote] = useState(null);
  const [pin, setPin] = useState(null);
  const [addressLine, setAddressLine] = useState('');
  const [notes, setNotes] = useState('');
  const [slot, setSlot] = useState('');
  const [pay, setPay] = useState('cod');
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setAddressLine(user.address_line || '');
      if (user.lat != null && user.lng != null) setPin({ lat: user.lat, lng: user.lng });
    }
  }, [user]);

  useEffect(() => {
    if (mode !== 'delivery' || !user) return;
    let cancel = false;
    (async () => {
      try {
        const res = await apiFetch('/api/quote', {
          method: 'POST',
          body: { pincode: user.pincode, lat: pin?.lat ?? user.lat, lng: pin?.lng ?? user.lng, subtotal },
        });
        if (!cancel) setQuote(res.quote);
      } catch {}
    })();
    return () => { cancel = true; };
  }, [mode, user, pin, subtotal]);

  const deliveryCharge = mode === 'delivery' && quote?.in_range ? quote.charge : 0;
  const total = subtotal + deliveryCharge;
  const canDeliver = quote?.in_range && delivery.enabled_today !== false;

  const placeOrder = async () => {
    setPlacing(true); setError('');
    try {
      const res = await apiFetch('/api/orders', {
        method: 'POST',
        body: {
          kind: 'catalog',
          fulfilment: mode,
          items: cartLines.map((l) => ({ id: l.id, qty: l.qty })),
          lat: pin?.lat, lng: pin?.lng, pincode: user.pincode,
          address_line: addressLine, notes, slot, payment_method: pay,
        },
      });
      clearCart();
      setPlaced(res.order);
      refresh();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  if (placed) {
    const waText = `Hi! I just placed order ${placed.code} on the website. Total ₹${placed.total}.`;
    return (
      <SiteChrome>
        <section className="wrap section" style={{ maxWidth: 620 }}>
          <div className="card pad center">
            <div style={{ fontSize: 52 }}>🎂</div>
            <h1 style={{ fontSize: '2rem', marginTop: 8 }}>Order placed!</h1>
            <p className="muted" style={{ marginTop: 8 }}>
              Order <b>{placed.code}</b> is with our bakers. We will confirm it shortly
              {placed.fulfilment === 'pickup' ? ' and keep it ready at the counter.' : ' and send it out for delivery.'}
            </p>
            <div className="card pad stack" style={{ marginTop: 20, textAlign: 'left', background: 'var(--bg)' }}>
              <span className="row-between"><span className="muted">Type</span><b style={{ textTransform: 'capitalize' }}>{placed.fulfilment}</b></span>
              <span className="row-between"><span className="muted">Items total</span><b>₹{placed.subtotal}</b></span>
              {placed.delivery_charge > 0 && <span className="row-between"><span className="muted">Delivery</span><b>₹{placed.delivery_charge}</b></span>}
              <span className="row-between"><span className="muted">Payable</span><b>₹{placed.total}</b></span>
              <span className="row-between"><span className="muted">Payment</span><b>{placed.payment_method === 'cod' ? 'Pay on pickup / delivery' : 'Paid online'}</b></span>
            </div>
            <div className="row" style={{ justifyContent: 'center', gap: 12, marginTop: 22, flexWrap: 'wrap' }}>
              <Link className="btn" href="/account">Track my order</Link>
              <a className="btn btn-ghost" style={{ background: '#25d366', color: '#fff' }}
                 href={`https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noreferrer">
                <WhatsAppIcon size={16} /> Send on WhatsApp
              </a>
            </div>
          </div>
        </section>
      </SiteChrome>
    );
  }

  if (ready && cartLines.length === 0) {
    return (
      <SiteChrome>
        <section className="wrap section center" style={{ maxWidth: 520 }}>
          <div className="card pad">
            <div style={{ fontSize: 44 }}>🧁</div>
            <h2 style={{ marginTop: 10 }}>Your basket is empty</h2>
            <p className="muted small" style={{ marginTop: 8 }}>Add something warm from the counter.</p>
            <Link className="btn" style={{ marginTop: 18 }} href="/menu">Browse the menu</Link>
          </div>
        </section>
      </SiteChrome>
    );
  }

  return (
    <SiteChrome>
      <section className="wrap section">
        <div className="eyebrow">Almost there</div>
        <h1>Checkout</h1>

        <div
        className="grid checkout-layout"
        style={{ gap: 24, marginTop: 22, alignItems: 'start' }}
      >
          <div className="stack">
            <div className="card pad">
              <b>Your basket ({cartLines.length})</b>
              <div className="stack" style={{ marginTop: 14 }}>
                {cartLines.map((l) => (
                  <div key={l.id} className="row-between" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
                    <div className="row" style={{ gap: 12 }}>
                      <img src={l.image} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover' }} />
                      <span>
                        <b className="small">{l.name}</b>
                        <div className="tiny muted">{l.unit} · ₹{l.price}</div>
                      </span>
                    </div>
                    <div className="row" style={{ gap: 14 }}>
                      <span className="qty">
                        <button onClick={() => setQty(l.id, l.qty - 1)}>−</button>
                        <span>{l.qty}</span>
                        <button onClick={() => setQty(l.id, Math.min(l.qty + 1, l.track_stock ? l.stock : 99))}>+</button>
                      </span>
                      <b style={{ minWidth: 62, textAlign: 'right' }}>₹{l.lineTotal}</b>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card pad">
              <b>How would you like it?</b>
              <div className="grid grid-2" style={{ gap: 12, marginTop: 12 }}>
                <button
                  className={'card pad row' + (mode === 'pickup' ? '' : '')}
                  onClick={() => setMode('pickup')}
                  style={{
                    gap: 12, cursor: 'pointer', textAlign: 'left',
                    borderColor: mode === 'pickup' ? 'var(--accent)' : 'var(--line)',
                    borderWidth: mode === 'pickup' ? 2 : 1, borderStyle: 'solid', background: mode === 'pickup' ? 'rgba(240,180,41,.08)' : 'var(--surface)',
                  }}
                >
                  <Icon name="bag" size={22} />
                  <span><b className="small">Pickup at shop</b><div className="tiny muted">{delivery.prep_time}</div></span>
                </button>

                <button
                  className="card pad row"
                  onClick={() => setMode('delivery')}
                  disabled={delivery.enabled_today === false}
                  style={{
                    gap: 12, cursor: delivery.enabled_today === false ? 'not-allowed' : 'pointer', textAlign: 'left',
                    opacity: delivery.enabled_today === false ? 0.55 : 1,
                    borderColor: mode === 'delivery' ? 'var(--accent)' : 'var(--line)',
                    borderWidth: mode === 'delivery' ? 2 : 1, borderStyle: 'solid', background: mode === 'delivery' ? 'rgba(240,180,41,.08)' : 'var(--surface)',
                  }}
                >
                  <Icon name="bike" size={22} />
                  <span>
                    <b className="small">Home delivery</b>
                    <div className="tiny muted">
                      {delivery.enabled_today === false ? 'Off today' : `Within ${delivery.radius_km} km`}
                    </div>
                  </span>
                </button>
              </div>

              {delivery.enabled_today === false && (
                <div className="alert alert-warn" style={{ marginTop: 12 }}>{delivery.off_reason}</div>
              )}

              {mode === 'pickup' && (
                <div className="card pad" style={{ marginTop: 14, background: 'var(--bg)' }}>
                  <b className="small">Pickup from</b>
                  <p className="small muted" style={{ marginTop: 6 }}>{shop.address}</p>
                  <p className="tiny muted">{shop.hours} · {shop.landmark}</p>
                </div>
              )}

              {mode === 'delivery' && user && (
                <div style={{ marginTop: 14 }}>
                  <div className="card pad" style={{ background: 'var(--bg)' }}>
                    <div className="row-between">
                      <b className="small">Deliver to</b>
                      <Link className="link tiny" href="/account">Edit address</Link>
                    </div>
                    <p className="small muted" style={{ marginTop: 6 }}>
                      {[user.locality, user.city, user.district, user.state, user.pincode].filter(Boolean).join(', ')}
                    </p>
                    <label className="field" style={{ marginTop: 10 }}>
                      House / street / landmark
                      <input className="input" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} placeholder="House name, street, landmark" />
                    </label>
                  </div>

                  <div className="card pad" style={{ marginTop: 12 }}>
                    <b className="small">Confirm the drop point</b>
                    <p className="tiny muted" style={{ margin: '6px 0 10px' }}>Drag the 🏠 pin to your gate for an accurate distance.</p>
                    <MapView
                      lat={Number(shop.lat)} lng={Number(shop.lng)} zoom={12}
                      radiusKm={delivery.radius_km} height={240} draggable pin={pin} onPinChange={setPin}
                    />
                    {quote && (
                      <div className={'alert ' + (canDeliver ? 'alert-ok' : 'alert-error')} style={{ marginTop: 12 }}>
                        {canDeliver
                          ? `Great — you are ${quote.distance_km} km away. Delivery ₹${quote.charge}${quote.charge === 0 ? ' (free)' : ''}.`
                          : quote.reason}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <label className="field" style={{ marginTop: 14 }}>
                Preferred time (optional)
                <input className="input" value={slot} onChange={(e) => setSlot(e.target.value)} placeholder="e.g. today 6 PM" />
              </label>
              <label className="field" style={{ marginTop: 12 }}>
                Notes for the bakers (optional)
                <textarea className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Less sugar, write Happy Birthday Aadhi…" />
              </label>
            </div>

            <div className="card pad">
              <b>Payment</b>
              <div className="stack" style={{ marginTop: 12 }}>
                {payments.cod_enabled !== false && (
                  <label className="row card pad" style={{ gap: 12, cursor: 'pointer', padding: 14 }}>
                    <input type="radio" name="pay" checked={pay === 'cod'} onChange={() => setPay('cod')} />
                    <span><b className="small">Pay on {mode === 'pickup' ? 'pickup' : 'delivery'}</b><div className="tiny muted">Cash / UPI at handover</div></span>
                  </label>
                )}
                <label className="row card pad" style={{ gap: 12, cursor: payments.razorpay_enabled ? 'pointer' : 'not-allowed', padding: 14, opacity: payments.razorpay_enabled ? 1 : 0.55 }}>
                  <input type="radio" name="pay" disabled={!payments.razorpay_enabled} checked={pay === 'razorpay'} onChange={() => setPay('razorpay')} />
                  <span>
                    <b className="small">Pay online (Razorpay)</b>
                    <div className="tiny muted">
                      {payments.razorpay_enabled ? 'UPI, cards, netbanking' : 'Enable it in admin → payments to accept online payments'}
                    </div>
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="card pad" style={{ position: 'sticky', top: 90 }}>
            <b>Bill summary</b>
            <div className="stack small" style={{ marginTop: 14, gap: 10 }}>
              <span className="row-between"><span className="muted">Items</span><b>₹{subtotal}</b></span>
              <span className="row-between">
                <span className="muted">Delivery</span>
                <b>{mode === 'pickup' ? 'Free pickup' : quote ? (deliveryCharge ? `₹${deliveryCharge}` : 'Free') : '—'}</b>
              </span>
              {delivery.free_above > 0 && mode === 'delivery' && subtotal < delivery.free_above && (
                <span className="tiny muted">Add ₹{delivery.free_above - subtotal} more for free delivery</span>
              )}
              <div style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }} className="row-between">
                <b>Total</b><span className="price">₹{total}</span>
              </div>
            </div>

            {error && <div className="alert alert-error" style={{ marginTop: 14 }}>{error}</div>}

            {!user ? (
              <div style={{ marginTop: 16 }}>
                <div className="alert alert-warn small">Please sign in or register to place the order.</div>
                <Link className="btn btn-block" style={{ marginTop: 12 }} href="/register?next=/checkout">Register &amp; continue</Link>
                <Link className="btn btn-ghost btn-block" style={{ marginTop: 10 }} href="/login?next=/checkout">I already have an account</Link>
              </div>
            ) : (
              <button
                className="btn btn-block" style={{ marginTop: 16 }} disabled={placing || (mode === 'delivery' && !canDeliver)}
                onClick={placeOrder}
              >
                {placing ? 'Placing order…' : `Place order · ₹${total}`}
              </button>
            )}

            <p className="tiny muted center" style={{ marginTop: 12 }}>
              You will get status updates here and on WhatsApp.
            </p>
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}
