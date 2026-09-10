'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import SiteChrome from '@/components/SiteChrome';
import MapView from '@/components/MapView';
import { useStore, apiFetch } from '@/components/Providers';
import { Icon } from '@/components/Icon';

const KERALA_DISTRICTS = [
  'Palakkad', 'Thrissur', 'Malappuram', 'Ernakulam', 'Kozhikode', 'Kannur', 'Kollam',
  'Kottayam', 'Alappuzha', 'Idukki', 'Pathanamthitta', 'Thiruvananthapuram', 'Wayanad', 'Kasaragod',
];

function RegisterInner() {
  const { setUser, refresh, shop, delivery, toast } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/account';

  const [form, setForm] = useState({
    name: '', phone: '', email: '', password: '', confirm_password: '',
    pincode: '', state: 'Kerala', district: 'Palakkad', city: '', locality: '', address_line: '',
  });
  const [pin, setPin] = useState(null);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // Live "can we deliver to you?" check as the pincode or map pin changes.
  useEffect(() => {
    const hasInput = /^\d{6}$/.test(form.pincode) || pin;
    if (!hasInput) { setQuote(null); return; }
    const t = setTimeout(async () => {
      try {
        const res = await apiFetch('/api/quote', {
          method: 'POST', body: { pincode: form.pincode, lat: pin?.lat, lng: pin?.lng },
        });
        setQuote(res.quote);
      } catch {}
    }, 350);
    return () => clearTimeout(t);
  }, [form.pincode, pin]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast('Your browser cannot share location', 'err');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPin({ lat: +pos.coords.latitude.toFixed(6), lng: +pos.coords.longitude.toFixed(6) });
        toast('Location captured — drag the pin to fine tune');
      },
      () => toast('Could not read your location. Drop the pin manually.', 'err')
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST', body: { ...form, lat: pin?.lat, lng: pin?.lng },
      });
      setUser(res.user);
      await refresh();
      toast('Account created. Happy ordering!');
      router.push(next);
    } catch (err) {
      setError(err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <SiteChrome>
      <section className="wrap section">
        <div className="grid" style={{ gridTemplateColumns: '1.15fr 0.85fr', gap: 26, alignItems: 'start' }}>
          <div className="card pad">
            <div className="eyebrow">Create your account</div>
            <h1 style={{ fontSize: '2rem' }}>Register to order</h1>
            <p className="muted small" style={{ marginTop: 6 }}>
              We need these details to bake, pack and deliver your order correctly.
            </p>

            <form onSubmit={submit} className="stack" style={{ marginTop: 20 }}>
              {error && <div className="alert alert-error">{error}</div>}

              <div className="form-grid">
                <label className="field">Full name
                  <input className="input" required value={form.name} onChange={set('name')} placeholder="Anjali Krishnan" />
                </label>
                <label className="field">Phone number
                  <input className="input" required value={form.phone} onChange={set('phone')} placeholder="9747614864" inputMode="numeric" />
                </label>
              </div>

              <label className="field">Email
                <input className="input" type="email" required value={form.email} onChange={set('email')} placeholder="you@email.com" />
              </label>

              <div className="form-grid">
                <label className="field">Password
                  <input className="input" type="password" required value={form.password} onChange={set('password')} placeholder="At least 6 characters" />
                </label>
                <label className="field">Confirm password
                  <input className="input" type="password" required value={form.confirm_password} onChange={set('confirm_password')} placeholder="Repeat password" />
                </label>
              </div>

              <div className="eyebrow" style={{ marginTop: 10 }}>Delivery address</div>

              <div className="form-grid">
                <label className="field">Pincode
                  <input className="input" required value={form.pincode} onChange={set('pincode')} placeholder="678687" inputMode="numeric" maxLength={6} />
                </label>
                <label className="field">State
                  <select className="input" value={form.state} onChange={set('state')}>
                    <option>Kerala</option><option>Tamil Nadu</option><option>Karnataka</option><option>Other</option>
                  </select>
                </label>
              </div>

              <div className="form-grid">
                <label className="field">District
                  <select className="input" value={form.district} onChange={set('district')}>
                    {KERALA_DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </label>
                <label className="field">City / town
                  <input className="input" required value={form.city} onChange={set('city')} placeholder="Thachanady" />
                </label>
              </div>

              <label className="field">Locality
                <input className="input" required value={form.locality} onChange={set('locality')} placeholder="Puducode" />
              </label>

              <label className="field">House / street (optional)
                <input className="input" value={form.address_line} onChange={set('address_line')} placeholder="House name, street, landmark" />
              </label>

              <button className="btn btn-block" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>

              <p className="small center muted">
                Already registered? <Link className="link" href={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link>
              </p>
            </form>
          </div>

          <div className="stack">
            <div className="card pad">
              <div className="row-between">
                <b>Pin your exact location</b>
                <button type="button" className="btn btn-ghost btn-sm" onClick={useMyLocation}>
                  <Icon name="pin" size={14} /> Use my location
                </button>
              </div>
              <p className="tiny muted" style={{ margin: '8px 0 12px' }}>
                Tap the map or drag the 🏠 pin. We use it only to check if you fall inside our {delivery.radius_km} km delivery circle.
              </p>
              <MapView
                lat={Number(shop.lat) || 10.6721} lng={Number(shop.lng) || 76.6467}
                zoom={12} radiusKm={delivery.radius_km} height={280}
                draggable pin={pin} onPinChange={setPin}
              />
              {pin && <p className="tiny muted" style={{ marginTop: 8 }}>Pin: {pin.lat}, {pin.lng}</p>}
            </div>

            {quote && (
              <div className={'card pad ' + (quote.in_range ? '' : '')}>
                <div className="row-between">
                  <b>Delivery check</b>
                  <span className={'tag ' + (quote.in_range ? 'tag-veg' : 'tag-off')}>
                    {quote.in_range ? 'In range' : 'Out of range'}
                  </span>
                </div>
                <div className="stack small" style={{ marginTop: 10, gap: 6 }}>
                  <span className="row-between"><span className="muted">Distance from shop</span><b>{quote.distance_km} km</b></span>
                  <span className="row-between"><span className="muted">We deliver within</span><b>{quote.radius_km} km</b></span>
                  {quote.in_range && (
                    <span className="row-between"><span className="muted">Delivery charge</span><b>₹{quote.charge}</b></span>
                  )}
                </div>
                {!quote.in_range && <p className="tiny" style={{ marginTop: 10, color: 'var(--danger)' }}>{quote.reason}</p>}
                {quote.in_range && quote.free_above > 0 && (
                  <p className="tiny muted" style={{ marginTop: 10 }}>Free delivery on orders above ₹{quote.free_above}.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}

export default function RegisterPage() {
  return <Suspense fallback={null}><RegisterInner /></Suspense>;
}
