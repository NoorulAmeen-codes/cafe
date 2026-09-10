'use client';

import { useEffect, useState } from 'react';
import AdminShell, { useAdmin } from '@/components/AdminShell';
import { apiFetch } from '@/components/Providers';
import { Icon, WhatsAppIcon } from '@/components/Icon';

export default function AdminCustomers() {
  return (
    <AdminShell title="Customers" subtitle="Every registered customer, their address and full order history">
      <Body />
    </AdminShell>
  );
}

function Body() {
  const { toast } = useAdmin();
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState(null);

  const load = () => apiFetch(`/api/admin/users?q=${encodeURIComponent(q)}`).then((r) => setUsers(r.users)).catch((e) => toast(e.message, 'err'));
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [q]);

  return (
    <>
      <div className="card pad row-between wrap-gap" style={{ marginBottom: 16 }}>
        <b>{users.length} customers</b>
        <input className="input" style={{ width: 240 }} placeholder="Search name, phone, email…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="card pad" style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr><th>Customer</th><th>Contact</th><th>Address</th><th>Distance</th><th>Orders</th><th style={{ textAlign: 'right' }}>Spent</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ cursor: 'pointer' }} onClick={() => setOpenId(u.id)}>
                <td><b>{u.name}</b><div className="tiny muted">Joined {new Date(u.created_at + 'Z').toLocaleDateString('en-IN')}</div></td>
                <td className="small">{u.phone}<div className="tiny muted">{u.email}</div></td>
                <td className="small">{[u.locality, u.city].filter(Boolean).join(', ')}<div className="tiny muted">{u.district} · {u.pincode}</div></td>
                <td className="small">{u.distance_km != null ? `${u.distance_km} km` : '—'}</td>
                <td><b>{u.orders}</b><div className="tiny muted">{u.last_order ? new Date(u.last_order + 'Z').toLocaleDateString('en-IN') : 'never'}</div></td>
                <td style={{ textAlign: 'right' }}><b>₹{Math.round(u.spent)}</b></td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={6} className="center muted">No customers yet</td></tr>}
          </tbody>
        </table>
      </div>

      {openId && <CustomerModal id={openId} onClose={() => setOpenId(null)} />}
    </>
  );
}

function CustomerModal({ id, onClose }) {
  const { toast } = useAdmin();
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(null);

    apiFetch(`/api/admin/users?id=${id}`)
      .then((r) => setUser(r.user))
      .catch((e) => toast(e.message, 'err'));
  }, [id, toast]);
  if (!user) return null;

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal pad" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680 }}>
        <div className="row-between">
          <div>
            <h3>{user.name}</h3>
            <div className="tiny muted">Customer since {new Date(user.created_at + 'Z').toLocaleDateString('en-IN')}</div>
          </div>
          <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={onClose}><Icon name="close" size={16} /></button>
        </div>

        <div className="grid grid-2" style={{ gap: 14, marginTop: 16 }}>
          <div className="card pad">
            <b className="small">Contact & address</b>
            <div className="stack tiny" style={{ marginTop: 8, gap: 6 }}>
              <a className="row" href={`tel:${user.phone}`}><Icon name="phone" size={13} /> {user.phone}</a>
              <a className="row" href={`mailto:${user.email}`}><Icon name="mail" size={13} /> {user.email}</a>
              <span className="muted">{[user.address_line, user.locality, user.city, user.district, user.state, user.pincode].filter(Boolean).join(', ')}</span>
              {user.lat != null && (
                <a
                className="link"
                href={`https://www.google.com/maps?q=${user.lat},${user.lng}`}
                target="_blank"
                rel="noreferrer"
              >
                Open pinned location ↗
              </a>
              )}
              <span className="muted">{user.distance_km != null ? `${user.distance_km} km from the shop` : 'Distance unknown'}</span>
              <a
              className="btn btn-ghost btn-sm"
              style={{ width: 'fit-content', marginTop: 6 }}
              href={`https://wa.me/91${String(user.phone).replace(/\D/g, '').slice(-10)}`}
              target="_blank"
              rel="noreferrer"
            >
              <WhatsAppIcon size={14} /> WhatsApp
            </a>
            </div>
          </div>
          <div className="card pad">
            <b className="small">Summary</b>
            <div className="stack tiny" style={{ marginTop: 8, gap: 6 }}>
              <span className="row-between"><span className="muted">Completed orders</span><b>{user.summary.orders}</b></span>
              <span className="row-between"><span className="muted">Lifetime value</span><b>₹{Math.round(user.summary.spent)}</b></span>
              <span className="row-between"><span className="muted">Custom cakes</span><b>{user.orders.filter((o) => o.kind === 'custom').length}</b></span>
            </div>
          </div>
        </div>

        <div className="card pad" style={{ marginTop: 14, maxHeight: 320, overflow: 'auto' }}>
          <b className="small">Order history</b>
          <table className="table" style={{ marginTop: 8 }}>
            <thead><tr><th>Code</th><th>Items / brief</th><th>Status</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
            <tbody>
              {user.orders.map((o) => {
                let c = null;
                try { c = o.customization ? JSON.parse(o.customization) : null; } catch {}
                return (
                  <tr key={o.id}>
                    <td><b>{o.code}</b><div className="tiny muted">{new Date(o.created_at + 'Z').toLocaleDateString('en-IN')}</div></td>
                    <td className="tiny">
                      {o.kind === 'custom' && c
                        ? <span className="highlight-box" style={{ display: 'block', padding: 8 }}>
                            {c.occasion} · {c.flavour} · {c.weight} · {c.shape}{c.eggless ? ' · eggless' : ''}
                            {c.message_on_cake ? <div>“{c.message_on_cake}”</div> : null}
                          </span>
                        : o.items.map((i) => `${i.name} ×${i.qty}`).join(', ')}
                    </td>
                    <td><span className={'status status-' + o.status}>{o.status.replace(/_/g, ' ')}</span></td>
                    <td style={{ textAlign: 'right' }}><b>₹{o.total}</b><div className="tiny muted">{o.payment_status}</div></td>
                  </tr>
                );
              })}
              {user.orders.length === 0 && <tr><td colSpan={4} className="center muted">No orders yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
