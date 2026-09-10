'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminShell, { useAdmin } from '@/components/AdminShell';
import { apiFetch } from '@/components/Providers';
import { Icon } from '@/components/Icon';

export default function AdminDashboard() {
  return (
    <AdminShell title="Dashboard" subtitle="Everything happening at the counter today">
      <DashboardBody />
    </AdminShell>
  );
}

function DashboardBody() {
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const { toast, state: adminState } = useAdmin();

  const load = () =>
  apiFetch('/api/admin/stats')
    .then(setData)
    .catch(() => {});

useEffect(() => {
  if (adminState !== 'in') return;

  load();

  const t = setInterval(load, 20000);
  return () => clearInterval(t);
}, [adminState]);

  if (!data) return <p className="muted">Loading…</p>;
  const { stats, recentOrders, lowStock, salesByDay, topProducts, delivery } = data;
  const maxDay = Math.max(1, ...salesByDay.map((d) => d.total));

  const toggleDelivery = async (on) => {
    setSaving(true);
    try {
      await apiFetch('/api/admin/settings', { method: 'PUT', body: { group: 'delivery', value: { enabled_today: on } } });
      toast(on ? 'Home delivery switched ON' : 'Home delivery switched OFF for today');
      load();
    } catch (e) { toast(e.message, 'err'); } finally { setSaving(false); }
  };

  return (
    <>
      <div className="card pad row-between wrap-gap" style={{ marginBottom: 20, borderLeft: '5px solid var(--accent)' }}>
        <div className="row" style={{ gap: 14 }}>
          <Icon name="truck" size={26} />
          <div>
            <b>Home delivery today</b>
            <div className="tiny muted">
              {delivery.enabled_today === false
                ? 'Currently OFF — customers can only order pickup.'
                : `ON — delivering within ${delivery.radius_km} km, from ₹${delivery.base_charge}.`}
            </div>
          </div>
        </div>
        <label className="switch">
          <input type="checkbox" checked={delivery.enabled_today !== false} disabled={saving}
                 onChange={(e) => toggleDelivery(e.target.checked)} />
          <span className="track" />
          <span className="small">{delivery.enabled_today === false ? 'Off' : 'On'}</span>
        </label>
      </div>

      <div className="grid grid-4">
        <Stat k="Orders today" v={stats.orders_today} sub={`${stats.orders_total} all time`} />
        <Stat k="Revenue today" v={`₹${Math.round(stats.revenue_today)}`} sub={`₹${Math.round(stats.revenue)} all time`} />
        <Stat k="Waiting approval" v={stats.pending} sub={`${stats.baking} in progress`} tone={stats.pending ? 'warn' : ''} />
        <Stat k="Customers" v={stats.customers} sub={`${stats.custom_requests} custom requests`} />
      </div>

      <div className="grid grid-4" style={{ marginTop: 16 }}>
        <Stat k="Delivered" v={stats.delivered} />
        <Stat k="Cancelled" v={stats.cancelled} />
        <Stat k="Out of stock" v={stats.out_of_stock} tone={stats.out_of_stock ? 'bad' : ''} />
        <Stat k="Open bugs" v={stats.open_bugs} tone={stats.open_bugs ? 'bad' : ''} />
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr', gap: 18, marginTop: 20, alignItems: 'start' }}>
        <div className="card pad">
          <div className="row-between">
            <b>Recent orders</b>
            <Link className="link tiny" href="/admin/orders">See all</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ marginTop: 10 }}>
              <thead><tr><th>Code</th><th>Customer</th><th>Type</th><th>Status</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td><Link className="link" href={`/admin/orders?id=${o.id}`}>{o.code}</Link></td>
                    <td>{o.customer}<div className="tiny muted">{o.phone}</div></td>
                    <td className="tiny" style={{ textTransform: 'capitalize' }}>
                      {o.fulfilment}{o.kind === 'custom' ? ' · custom' : ''}
                    </td>
                    <td><span className={'status status-' + o.status}>{o.status.replace(/_/g, ' ')}</span></td>
                    <td style={{ textAlign: 'right' }}><b>₹{o.total}</b></td>
                  </tr>
                ))}
                {recentOrders.length === 0 && <tr><td colSpan={5} className="center muted">No orders yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="stack">
          <div className="card pad">
            <b>Last 7 days</b>
            <div className="stack" style={{ marginTop: 12, gap: 10 }}>
              {salesByDay.length === 0 && <p className="tiny muted">No sales yet.</p>}
              {salesByDay.map((d) => (
                <div key={d.d}>
                  <div className="row-between tiny"><span className="muted">{d.d}</span><b>₹{Math.round(d.total)} · {d.orders} orders</b></div>
                  <div className="bar" style={{ marginTop: 4 }}><i style={{ width: `${(d.total / maxDay) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card pad">
            <div className="row-between">
              <b>Low / out of stock</b>
              <Link className="link tiny" href="/admin/products">Manage</Link>
            </div>
            <div className="stack" style={{ marginTop: 10, gap: 8 }}>
              {lowStock.length === 0 && <p className="tiny muted">Everything is well stocked 🎉</p>}
              {lowStock.map((p) => (
                <div key={p.id} className="row-between small">
                  <span>{p.name}</span>
                  <span className={'stock-pill ' + (p.stock <= 0 ? 'stock-out' : 'stock-low')}>
                    {p.stock <= 0 ? 'Sold out' : `${p.stock} left`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card pad">
            <b>Best sellers</b>
            <div className="stack" style={{ marginTop: 10, gap: 8 }}>
              {topProducts.map((p) => (
                <div key={p.name} className="row-between small">
                  <span>{p.name}</span><b>{p.sold} sold</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Stat({ k, v, sub, tone }) {
  const color = tone === 'bad' ? 'var(--danger)' : tone === 'warn' ? '#b07d0a' : 'inherit';
  return (
    <div className="stat">
      <div className="k">{k}</div>
      <div className="v" style={{ color }}>{v}</div>
      {sub && <div className="tiny muted">{sub}</div>}
    </div>
  );
}
