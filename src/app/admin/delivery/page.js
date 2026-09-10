'use client';

import { useEffect, useState } from 'react';
import AdminShell, { useAdmin } from '@/components/AdminShell';
import MapView from '@/components/MapView';
import { apiFetch } from '@/components/Providers';
import { Icon } from '@/components/Icon';

export default function AdminDelivery() {
  return (
    <AdminShell title="Delivery & location" subtitle="Shop position on the map, delivery range, charges and today's on/off switch">
      <Body />
    </AdminShell>
  );
}

function Body() {
  const { toast } = useAdmin();
  const [shop, setShop] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [busy, setBusy] = useState(false);
  const [test, setTest] = useState({ pincode: '', result: null });

  const load = () => apiFetch('/api/admin/settings').then((r) => { setShop(r.settings.shop); setDelivery(r.settings.delivery); }).catch((e) => toast(e.message, 'err'));
  useEffect(() => { load(); }, []);

  if (!shop || !delivery) return <p className="muted">Loading…</p>;

  const saveGroup = async (group, value) => {
    setBusy(true);
    try { await apiFetch('/api/admin/settings', { method: 'PUT', body: { group, value } }); toast('Saved'); load(); }
    catch (e) { toast(e.message, 'err'); } finally { setBusy(false); }
  };

  const runTest = async () => {
    try {
      const res = await apiFetch('/api/quote', { method: 'POST', body: { pincode: test.pincode } });
      setTest({ ...test, result: res.quote });
    } catch (e) { toast(e.message, 'err'); }
  };

  return (
    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }}>
      <div className="stack">
        <div className="card pad row-between wrap-gap" style={{ borderLeft: '5px solid var(--accent)' }}>
          <div>
            <b>Home delivery today</b>
            <p className="tiny muted" style={{ marginTop: 4 }}>
              Switch this off on a busy day — the site will only accept pickup orders.
            </p>
          </div>
          <label className="switch">
            <input type="checkbox" checked={delivery.enabled_today !== false}
                   onChange={(e) => saveGroup('delivery', { enabled_today: e.target.checked })} />
            <span className="track" />
            <span className="small">{delivery.enabled_today === false ? 'Off' : 'On'}</span>
          </label>
        </div>

        <div className="card pad stack">
          <b>Delivery range & charges</b>
          <label className="field">
            Delivery radius: <b>{delivery.radius_km} km</b>
            <input type="range" min="1" max="25" step="0.5" value={delivery.radius_km}
                   onChange={(e) => setDelivery({ ...delivery, radius_km: Number(e.target.value) })}
                   onMouseUp={(e) => saveGroup('delivery', { radius_km: Number(e.target.value) })}
                   onTouchEnd={(e) => saveGroup('delivery', { radius_km: Number(e.target.value) })} />
          </label>

          <div className="form-grid">
            <label className="field">Base charge ₹
              <input className="input" type="number" value={delivery.base_charge}
                     onChange={(e) => setDelivery({ ...delivery, base_charge: e.target.value })} />
            </label>
            <label className="field">Per km after 1 km ₹
              <input className="input" type="number" value={delivery.per_km_charge}
                     onChange={(e) => setDelivery({ ...delivery, per_km_charge: e.target.value })} />
            </label>
          </div>
          <div className="form-grid">
            <label className="field">Free delivery above ₹
              <input className="input" type="number" value={delivery.free_above}
                     onChange={(e) => setDelivery({ ...delivery, free_above: e.target.value })} />
            </label>
            <label className="field">Minimum order ₹
              <input className="input" type="number" value={delivery.min_order}
                     onChange={(e) => setDelivery({ ...delivery, min_order: e.target.value })} />
            </label>
          </div>
          <label className="field">Pickup promise shown to customers
            <input className="input" value={delivery.prep_time || ''} onChange={(e) => setDelivery({ ...delivery, prep_time: e.target.value })} />
          </label>
          <label className="field">Message when delivery is off
            <textarea className="input" value={delivery.off_reason || ''} onChange={(e) => setDelivery({ ...delivery, off_reason: e.target.value })} />
          </label>
          <button className="btn" disabled={busy} onClick={() => saveGroup('delivery', delivery)}>Save delivery settings</button>

          <div className="card pad" style={{ background: 'var(--bg)' }}>
            <b className="small">Charge preview</b>
            <div className="stack tiny" style={{ marginTop: 8, gap: 4 }}>
              {[1, 2, 3, 5, 8].map((km) => {
                const inRange = km <= delivery.radius_km;
                const charge = Math.round(Number(delivery.base_charge) + Number(delivery.per_km_charge) * Math.max(0, km - 1));
                return (
                  <span key={km} className="row-between">
                    <span className="muted">{km} km away</span>
                    <b style={{ color: inRange ? 'inherit' : 'var(--danger)' }}>{inRange ? `₹${charge}` : 'Out of range'}</b>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card pad">
          <b>Check a pincode</b>
          <p className="tiny muted" style={{ marginTop: 4 }}>See exactly what a customer in that area would be told.</p>
          <div className="row" style={{ gap: 10, marginTop: 10 }}>
            <input className="input" placeholder="678687" value={test.pincode} maxLength={6}
                   onChange={(e) => setTest({ pincode: e.target.value, result: null })} />
            <button className="btn btn-ghost btn-sm" onClick={runTest}>Check</button>
          </div>
          {test.result && (
            <div className={'alert ' + (test.result.in_range ? 'alert-ok' : 'alert-error')} style={{ marginTop: 12 }}>
              {test.result.resolved
                ? test.result.in_range
                  ? `${test.result.place || 'That area'} is ${test.result.distance_km} km away — delivery ₹${test.result.charge}.`
                  : test.result.reason
                : test.result.reason}
            </div>
          )}
        </div>
      </div>

      <div className="stack">
        <div className="card pad">
          <b>Shop location</b>
          <p className="tiny muted" style={{ margin: '4px 0 12px' }}>
            Tap the map (or drag the 🏠 pin) to set exactly where the bakery is. The shaded circle is your delivery range.
          </p>
          <MapView
            lat={Number(shop.lat)} lng={Number(shop.lng)} zoom={13} radiusKm={delivery.radius_km} height={340}
            draggable pin={{ lat: Number(shop.lat), lng: Number(shop.lng) }}
            onPinChange={(p) => setShop({ ...shop, lat: p.lat, lng: p.lng })}
          />
          <div className="form-grid" style={{ marginTop: 12 }}>
            <label className="field">Latitude<input className="input" value={shop.lat} onChange={(e) => setShop({ ...shop, lat: e.target.value })} /></label>
            <label className="field">Longitude<input className="input" value={shop.lng} onChange={(e) => setShop({ ...shop, lng: e.target.value })} /></label>
          </div>
          <label className="field" style={{ marginTop: 10 }}>Full address shown on the site
            <textarea className="input" value={shop.address} onChange={(e) => setShop({ ...shop, address: e.target.value })} />
          </label>
          <label className="field" style={{ marginTop: 10 }}>Landmark line
            <input className="input" value={shop.landmark || ''} onChange={(e) => setShop({ ...shop, landmark: e.target.value })} />
          </label>
          <div className="row" style={{ gap: 10, marginTop: 12 }}>
            <button className="btn" disabled={busy} onClick={() => saveGroup('shop', shop)}>Save location</button>
            <a className="btn btn-ghost btn-sm" href={`https://www.google.com/maps?q=${shop.lat},${shop.lng}`} target="_blank" rel="noreferrer">
              <Icon name="pin" size={14} /> Verify on Google Maps
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
