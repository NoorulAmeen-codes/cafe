'use client';

import { useEffect, useState } from 'react';
import AdminShell, { useAdmin } from '@/components/AdminShell';
import { apiFetch } from '@/components/Providers';
import { Icon, WhatsAppIcon } from '@/components/Icon';

export default function AdminSettings() {
  return (
    <AdminShell title="Shop settings" subtitle="Name, phone, WhatsApp, email, hours, payments and the admin password">
      <Body />
    </AdminShell>
  );
}

function Body() {
  const { toast } = useAdmin();
  const [shop, setShop] = useState(null);
  const [payments, setPayments] = useState(null);
  const [admin, setAdmin] = useState({ username: '', password: '' });
  const [busy, setBusy] = useState(false);

  const load = () => apiFetch('/api/admin/settings').then((r) => {
    setShop(r.settings.shop);
setPayments(r.settings.payments);
setAdmin({
  username: r.settings.admin?.username || '',
  password: '',
});
  }).catch((e) => toast(e.message, 'err'));
  useEffect(() => { load(); }, []);

  if (!shop || !payments) return <p className="muted">Loading…</p>;

  const save = async (group, value) => {
  setBusy(true);

  try {
    let saveValue = value;

    if (group === 'admin') {
      saveValue = {
        username: String(value.username || '').trim(),
        password: String(value.password || ''),
      };

      if (!saveValue.username) {
        toast('Username is required', 'err');
        return;
      }

      if (saveValue.password.length < 12) {
        toast('Password must be at least 12 characters', 'err');
        return;
      }
    }

    await apiFetch('/api/admin/settings', {
      method: 'PUT',
      body: { group, value: saveValue },
    });

    toast('Saved');
    load();
  } catch (e) {
    toast(e.message, 'err');
  } finally {
    setBusy(false);
  }
};

  return (
    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }}>
      <div className="stack">
        <div className="card pad stack">
          <b>Shop identity</b>
          <label className="field">Shop name<input className="input" value={shop.name} onChange={(e) => setShop({ ...shop, name: e.target.value })} /></label>
          <div className="form-grid">
            <label className="field">Tagline (under the logo)<input className="input" value={shop.tagline} onChange={(e) => setShop({ ...shop, tagline: e.target.value })} /></label>
            <label className="field">Opening hours<input className="input" value={shop.hours} onChange={(e) => setShop({ ...shop, hours: e.target.value })} /></label>
          </div>
          <label className="field">Short description (footer)
            <textarea className="input" value={shop.blurb} onChange={(e) => setShop({ ...shop, blurb: e.target.value })} />
          </label>
          <button className="btn" disabled={busy} onClick={() => save('shop', shop)}>Save identity</button>
        </div>

        <div className="card pad stack">
          <b>Contact details</b>
          <div className="form-grid">
            <label className="field">Phone (shown on the site)
              <input className="input" value={shop.phone} onChange={(e) => setShop({ ...shop, phone: e.target.value })} placeholder="+91 97476 14864" />
            </label>
            <label className="field">WhatsApp number (digits, with 91)
              <input className="input" value={shop.whatsapp} onChange={(e) => setShop({ ...shop, whatsapp: e.target.value })} placeholder="919747614864" />
            </label>
          </div>
          <label className="field">Email<input className="input" value={shop.email} onChange={(e) => setShop({ ...shop, email: e.target.value })} /></label>
          <div className="row wrap-gap" style={{ gap: 10 }}>
            <button className="btn" disabled={busy} onClick={() => save('shop', shop)}>Save contact</button>
            <a className="btn btn-ghost btn-sm" href={`https://wa.me/${String(shop.whatsapp || '').replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
              <WhatsAppIcon size={15} /> Test WhatsApp link
            </a>
          </div>
          <p className="tiny muted">
            The floating WhatsApp button, the “Ask on WhatsApp” buttons and order messages all use this number.
          </p>
        </div>
      </div>

      <div className="stack">
        <div className="card pad stack">
          <b>Payments</b>
          <label className="switch">
            <input type="checkbox" checked={payments.cod_enabled !== false} onChange={(e) => setPayments({ ...payments, cod_enabled: e.target.checked })} />
            <span className="track" /><span className="small">Accept cash / UPI on handover</span>
          </label>
          <label className="switch">
            <input type="checkbox" checked={!!payments.razorpay_enabled} onChange={(e) => setPayments({ ...payments, razorpay_enabled: e.target.checked })} />
            <span className="track" /><span className="small">Accept online payments (Razorpay)</span>
          </label>
          <div className="form-grid">
            <label className="field">Razorpay Key ID
              <input className="input" value={payments.razorpay_key_id || ''} onChange={(e) => setPayments({ ...payments, razorpay_key_id: e.target.value })} placeholder="rzp_live_…" />
            </label>
            <label className="field">Razorpay Key Secret
              <input className="input" type="password" value={payments.razorpay_key_secret || ''} onChange={(e) => setPayments({ ...payments, razorpay_key_secret: e.target.value })} placeholder="••••••••" />
            </label>
          </div>
          <label className="field">UPI ID (for the counter QR)
            <input className="input" value={payments.upi_id || ''} onChange={(e) => setPayments({ ...payments, upi_id: e.target.value })} />
          </label>
          <button className="btn" disabled={busy} onClick={() => save('payments', payments)}>Save payments</button>
          <p className="tiny muted">
            Razorpay is wired up as a stub: turning it on shows the online option at checkout and marks those orders paid.
            Drop in real keys and the checkout call becomes a live Razorpay order.
          </p>
        </div>

        <div className="card pad stack">
          <b>Admin login</b>
          <div className="form-grid">
            <label className="field">Username<input className="input" value={admin.username || ''} onChange={(e) => setAdmin({ ...admin, username: e.target.value })} /></label>
            <label className="field">Password<input className="input" type="password" value={admin.password || ''} onChange={(e) => setAdmin({ ...admin, password: e.target.value })} /></label>
          </div>
          <button className="btn btn-primary" disabled={busy} onClick={() => save('admin', admin)}>
            <Icon name="gear" size={15} /> Update admin credentials
          </button>
          <p className="tiny muted">Change this before going live — anyone with these details can manage orders.</p>
        </div>
      </div>
    </div>
  );
}
