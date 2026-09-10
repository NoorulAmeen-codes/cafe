'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import SiteChrome from '@/components/SiteChrome';
import { useStore, apiFetch } from '@/components/Providers';
import { Icon, WhatsAppIcon } from '@/components/Icon';

const OCCASIONS = ['Birthday', 'Anniversary', 'Wedding', 'Baby shower', 'Corporate', 'Other'];
const FLAVOURS = ['Chocolate Truffle', 'Red Velvet', 'Black Forest', 'Butterscotch', 'Pineapple', 'Vanilla', 'Blueberry', 'Fresh Fruit'];
const WEIGHTS = [
  { label: '500 g', value: '500 g', base: 450 },
  { label: '1 kg', value: '1 kg', base: 750 },
  { label: '1.5 kg', value: '1.5 kg', base: 1100 },
  { label: '2 kg', value: '2 kg', base: 1450 },
  { label: '3 kg', value: '3 kg', base: 2150 },
];
const SHAPES = ['Round', 'Square', 'Heart', 'Number', 'Custom shape'];

function CustomCakeInner() {
  const { user, shop, delivery, toast, refresh } = useStore();
  const router = useRouter();
  const params = useSearchParams();

  const [form, setForm] = useState({
    occasion: 'Birthday', flavour: 'Chocolate Truffle', weight: '1 kg', shape: 'Round',
    eggless: false, tiers: 1, message_on_cake: '', colour_theme: '', needed_on: '', extra_notes: '',
  });
  const [fulfilment, setFulfilment] = useState('pickup');
  const [refImage, setRefImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [placed, setPlaced] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  // Transparent estimate — the bakery confirms the final price when approving.
  const estimate = useMemo(() => {
    const base = WEIGHTS.find((w) => w.value === form.weight)?.base || 750;
    let price = base;
    if (['Fresh Fruit', 'Blueberry', 'Red Velvet'].includes(form.flavour)) price += 120;
    if (form.eggless) price += 60;
    if (form.shape === 'Heart' || form.shape === 'Number') price += 150;
    if (form.shape === 'Custom shape') price += 300;
    price += (Number(form.tiers) - 1) * 450;
    if (refImage) price += 100;
    return Math.round(price);
  }, [form, refImage]);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) return toast('Please pick an image under 4 MB', 'err');
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await apiFetch('/api/customer-upload', { method: 'POST', body: { data: reader.result } });
        setRefImage(res.url);
        toast('Reference photo attached');
      } catch (err) {
        toast(err.message, 'err');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!user) return router.push('/register?next=/custom-cake');
    setBusy(true); setError('');
    try {
      const res = await apiFetch('/api/orders', {
        method: 'POST',
        body: {
          kind: 'custom', fulfilment, items: [],
          customization: { ...form },
          reference_image: refImage,
          notes: form.extra_notes, payment_method: 'cod',
          lat: user.lat, lng: user.lng, pincode: user.pincode,
        },
      });
      setPlaced(res.order);
      refresh();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (placed) {
    const waText = `Hi! I submitted a custom cake request ${placed.code} — ${form.flavour}, ${form.weight}, ${form.occasion}.`;
    return (
      <SiteChrome>
        <section className="wrap section" style={{ maxWidth: 620 }}>
          <div className="card pad center">
            <div style={{ fontSize: 52 }}>🎨</div>
            <h1 style={{ fontSize: '2rem', marginTop: 8 }}>Request sent!</h1>
            <p className="muted" style={{ marginTop: 8 }}>
              Request <b>{placed.code}</b> is with our cake artists. We will confirm the design and the final price
              (estimate ₹{estimate}) before we start baking.
            </p>
            <div className="row" style={{ justifyContent: 'center', gap: 12, marginTop: 22, flexWrap: 'wrap' }}>
              <Link className="btn" href="/account">See my requests</Link>
              <a className="btn btn-ghost" style={{ background: '#25d366', color: '#fff' }}
                 href={`https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noreferrer">
                <WhatsAppIcon size={16} /> Discuss on WhatsApp
              </a>
            </div>
          </div>
        </section>
      </SiteChrome>
    );
  }

  return (
    <SiteChrome>
      <section className="wrap section">
        <div className="eyebrow">Made to order</div>
        <h1>Design Your Cake</h1>
        <p className="muted" style={{ marginTop: 8, maxWidth: 620 }}>
          Tell us the occasion, pick a flavour and attach a reference photo — we will bake it exactly the way you imagined.
        </p>

          <form
            onSubmit={submit}
            className="grid custom-cake-layout"
            style={{ gap: 24, marginTop: 24, alignItems: 'start' }}
          >
          <div className="stack">
            <div className="card pad">
              <b>Occasion</b>
              <div className="row wrap-gap" style={{ marginTop: 12 }}>
                {OCCASIONS.map((o) => (
                  <button type="button" key={o} className={'chip' + (form.occasion === o ? ' active' : '')} onClick={() => setForm({ ...form, occasion: o })}>{o}</button>
                ))}
              </div>
            </div>

            <div className="card pad">
              <b>Flavour</b>
              <div className="row wrap-gap" style={{ marginTop: 12 }}>
                {FLAVOURS.map((f) => (
                  <button type="button" key={f} className={'chip' + (form.flavour === f ? ' active' : '')} onClick={() => setForm({ ...form, flavour: f })}>{f}</button>
                ))}
              </div>

              <div className="row-between wrap-gap" style={{ marginTop: 18 }}>
                <div>
                  <b>Weight</b>
                  <div className="row wrap-gap" style={{ marginTop: 10 }}>
                    {WEIGHTS.map((w) => (
                      <button type="button" key={w.value} className={'chip' + (form.weight === w.value ? ' active' : '')} onClick={() => setForm({ ...form, weight: w.value })}>{w.label}</button>
                    ))}
                  </div>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={form.eggless} onChange={set('eggless')} />
                  <span className="track" />
                  <span className="small">Make it eggless</span>
                </label>
              </div>
            </div>

            <div className="card pad">
              <b>Shape &amp; tiers</b>
              <div className="row wrap-gap" style={{ marginTop: 12 }}>
                {SHAPES.map((s) => (
                  <button type="button" key={s} className={'chip' + (form.shape === s ? ' active' : '')} onClick={() => setForm({ ...form, shape: s })}>{s}</button>
                ))}
              </div>
              <div className="form-grid" style={{ marginTop: 16 }}>
                <label className="field">Number of tiers
                  <select className="input" value={form.tiers} onChange={set('tiers')}>
                    {[1, 2, 3].map((n) => <option key={n} value={n}>{n} tier{n > 1 ? 's' : ''}</option>)}
                  </select>
                </label>
                <label className="field">Needed on
                  <input className="input" type="date" value={form.needed_on} onChange={set('needed_on')} min={new Date().toISOString().slice(0, 10)} />
                </label>
              </div>
            </div>

            <div className="card pad">
              <b>Personalise it</b>
              <div className="form-grid" style={{ marginTop: 12 }}>
                <label className="field">Message on the cake
                  <input className="input" value={form.message_on_cake} onChange={set('message_on_cake')} placeholder="Happy Birthday Aadhi!" maxLength={60} />
                </label>
                <label className="field">Colour theme
                  <input className="input" value={form.colour_theme} onChange={set('colour_theme')} placeholder="Pastel pink & gold" />
                </label>
              </div>
              <label className="field" style={{ marginTop: 12 }}>
                Anything else we should know?
                <textarea className="input" value={form.extra_notes} onChange={set('extra_notes')} placeholder="Nut allergy, cartoon topper, delivery time…" />
              </label>
            </div>

            <div className="card pad">
              <b>Reference photo (optional)</b>
              <p className="tiny muted" style={{ marginTop: 6 }}>Seen a design you love? Attach it and we will match it as closely as we can.</p>
              <div className="row wrap-gap" style={{ marginTop: 12, gap: 14 }}>
                <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                  <Icon name="edit" size={15} /> {uploading ? 'Uploading…' : 'Choose image'}
                  <input type="file" accept="image/*" hidden onChange={upload} />
                </label>
                {refImage && (
                  <div className="row" style={{ gap: 10 }}>
                    <img src={refImage} alt="Reference" style={{ width: 78, height: 78, objectFit: 'cover', borderRadius: 12 }} />
                    <button type="button" className="link tiny" onClick={() => setRefImage('')}>Remove</button>
                  </div>
                )}
              </div>
            </div>

            <div className="card pad">
              <b>Pickup or delivery?</b>
              <div className="row wrap-gap" style={{ marginTop: 12 }}>
                <button type="button" className={'chip' + (fulfilment === 'pickup' ? ' active' : '')} onClick={() => setFulfilment('pickup')}>
                  <Icon name="bag" size={14} /> Pickup at shop
                </button>
                <button type="button" className={'chip' + (fulfilment === 'delivery' ? ' active' : '')}
                  disabled={delivery.enabled_today === false} onClick={() => setFulfilment('delivery')}>
                  <Icon name="bike" size={14} /> Home delivery {delivery.enabled_today === false ? '(off today)' : `(within ${delivery.radius_km} km)`}
                </button>
              </div>
            </div>
          </div>

          <div className="card pad" style={{ position: 'sticky', top: 90 }}>
            <b>Your cake so far</b>
            <div className="stack small" style={{ marginTop: 14, gap: 8 }}>
              <span className="row-between"><span className="muted">Occasion</span><b>{form.occasion}</b></span>
              <span className="row-between"><span className="muted">Flavour</span><b>{form.flavour}</b></span>
              <span className="row-between"><span className="muted">Weight</span><b>{form.weight}</b></span>
              <span className="row-between"><span className="muted">Shape</span><b>{form.shape}</b></span>
              <span className="row-between"><span className="muted">Tiers</span><b>{form.tiers}</b></span>
              <span className="row-between"><span className="muted">Eggless</span><b>{form.eggless ? 'Yes' : 'No'}</b></span>
              {form.message_on_cake && <span className="row-between"><span className="muted">Message</span><b>“{form.message_on_cake}”</b></span>}
              {form.needed_on && <span className="row-between"><span className="muted">Needed on</span><b>{form.needed_on}</b></span>}
            </div>

            <div className="highlight-box" style={{ marginTop: 16 }}>
              <div className="row-between">
                <span className="small muted">Estimated price</span>
                <span className="price">₹{estimate}</span>
              </div>
              <p className="tiny muted" style={{ marginTop: 6 }}>
                Final price is confirmed by the bakery before baking starts. No payment now.
              </p>
            </div>

            {error && <div className="alert alert-error" style={{ marginTop: 14 }}>{error}</div>}

            <button className="btn btn-block" style={{ marginTop: 16 }} disabled={busy}>
              {busy ? 'Sending…' : user ? 'Send my cake request' : 'Register & send request'}
            </button>
            <a className="btn btn-ghost btn-block" style={{ marginTop: 10 }}
               href={`https://wa.me/${shop.whatsapp}?text=${encodeURIComponent('Hi! I want to order a custom cake.')}`} target="_blank" rel="noreferrer">
              <WhatsAppIcon size={16} /> Ask on WhatsApp first
            </a>
          </div>
        </form>
      </section>
    </SiteChrome>
  );
}

export default function CustomCakePage() {
  return <Suspense fallback={null}><CustomCakeInner /></Suspense>;
}
