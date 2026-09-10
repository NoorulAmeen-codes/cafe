'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminShell, { useAdmin } from '@/components/AdminShell';
import { apiFetch } from '@/components/Providers';
import { Icon, WhatsAppIcon } from '@/components/Icon';

const TABS = [
  ['all', 'All'], ['placed', 'Waiting approval'], ['approved', 'Approved'], ['baking', 'Baking'],
  ['ready', 'Ready'], ['out_for_delivery', 'Out for delivery'], ['delivered', 'Delivered'], ['cancelled', 'Cancelled'],
];

export default function AdminOrders() {
  return (
    <AdminShell title="Orders" subtitle="Approve, track and close every order — customisation details included">
      <Suspense fallback={null}><Body /></Suspense>
    </AdminShell>
  );
}

function Body() {
  const { toast, state: adminState } = useAdmin();
  const params = useSearchParams();
  const [status, setStatus] = useState('placed');
  const [q, setQ] = useState('');
  const [data, setData] = useState({ orders: [], counts: {} });
  const [openId, setOpenId] = useState(params.get('id') ? Number(params.get('id')) : null);

  const load = useCallback(async () => {
  if (adminState !== 'in') return;

  try {
    const res = await apiFetch(
      `/api/admin/orders?status=${status}&q=${encodeURIComponent(q)}`
    );
    setData(res);
  } catch (e) {
    toast(e.message, 'err');
  }
}, [status, q, adminState]);

const quickApprove = async (e, id) => {
  e.stopPropagation();

  try {
    await apiFetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      body: { status: 'approved' },
    });

    toast('Order approved');
    load();
  } catch (e) {
    toast(e.message, 'err');
  }
};

 useEffect(() => {
  if (adminState !== 'in') return;
  load();
}, [adminState, load]);

useEffect(() => {
  if (adminState !== 'in') return;

  const t = setInterval(load, 15000);
  return () => clearInterval(t);
}, [adminState, load]);

  return (
    <>
      <div className="card pad row-between wrap-gap admin-products-controls" style={{ marginBottom: 16 }}>
        <div className="row wrap-gap">
          {TABS.map(([k, l]) => (
            <button key={k} className={'chip' + (status === k ? ' active' : '')} onClick={() => setStatus(k)}>
              {l} <span className="count">{data.counts[k] ?? 0}</span>
            </button>
          ))}
        </div>
        <input className="input" style={{ width: 220 }} placeholder="Search code, name, phone…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {/* DESKTOP ORDERS TABLE */}
<div className="admin-orders-desktop card pad" style={{ overflowX: 'auto' }}>
  <table className="table">
    <thead>
      <tr>
        <th>Order</th>
        <th>Customer</th>
        <th>Items</th>
        <th>Type</th>
        <th>Payment</th>
        <th>Status</th>
        <th style={{ textAlign: 'right' }}>Total</th>
      </tr>
    </thead>

    <tbody>
      {data.orders.map((o) => (
        <tr
          key={o.id}
          style={{ cursor: 'pointer' }}
          onClick={() => setOpenId(o.id)}
        >
          <td>
            <b>{o.code}</b>

            <div className="tiny muted">
              {new Date(o.created_at + 'Z').toLocaleString('en-IN')}
            </div>

            {o.kind === 'custom' && (
              <span
                className="tag tag-eggless"
                style={{ marginTop: 4 }}
              >
                Custom
              </span>
            )}
          </td>

          <td>
            {o.customer}
            <div className="tiny muted">
              {o.phone}
            </div>
          </td>

          <td className="small">
            {o.kind === 'custom'
              ? (
                <span className="tiny">
                  {o.customization?.flavour} · {o.customization?.weight}
                </span>
              )
              : o.items
                  .map((i) => `${i.name} ×${i.qty}`)
                  .join(', ')
                  .slice(0, 42)}
          </td>

          <td
            className="tiny"
            style={{ textTransform: 'capitalize' }}
          >
            {o.fulfilment}

            {o.distance_km ? (
              <div className="muted">
                {o.distance_km} km
              </div>
            ) : null}
          </td>

          <td>
            <span
              className={
                'status ' +
                (
                  o.payment_status === 'paid'
                    ? 'status-delivered'
                    : 'status-placed'
                )
              }
            >
              {o.payment_status}
            </span>
          </td>

          <td>
            <span className={'status status-' + o.status}>
              {o.status.replace(/_/g, ' ')}
            </span>
          </td>

          <td style={{ textAlign: 'right' }}>
            <b>₹{o.total}</b>
          </td>
        </tr>
      ))}

      {data.orders.length === 0 && (
        <tr>
          <td colSpan={7} className="center muted">
            No orders here
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>


{/* MOBILE ORDERS */}
<div className="admin-orders-mobile">

  {data.orders.map((o) => (
    <div
  className={'admin-mobile-order' + (o.status === 'placed' ? ' waiting-approval' : '')}
  onClick={() => setOpenId(o.id)}
>

      {/* TOP ROW */}
      <div className="admin-mobile-order-top">

        {/* LOGO */}
        <div className="admin-mobile-order-logo">
          <Icon name="cake" size={20} />
        </div>

        {/* PHONE */}
        <div className="admin-mobile-order-phone">
          <span className="tiny muted">Phone</span>
          <b>{o.phone || '—'}</b>
        </div>

        {/* TOTAL */}
        <div className="admin-mobile-order-total">
          <span className="tiny muted">Total</span>
          <b>₹{o.total}</b>
        </div>

      </div>


      {/* BOTTOM ROW */}
      <div className="admin-mobile-order-bottom">

        {/* ORDER CODE */}
        <div className="admin-mobile-order-code">
          <span className="tiny muted">Order</span>
          <b>{o.code}</b>

          {o.kind === 'custom' && (
            <span className="tag tag-eggless">
              Custom
            </span>
          )}
        </div>


        {/* APPROVE / STATUS */}
        {o.status === 'placed' ? (
          <button
            className="btn btn-success btn-sm admin-mobile-approve"
            onClick={(e) => quickApprove(e, o.id)}
          >
            <Icon name="check" size={14} />
            Approve
          </button>
        ) : (
          <span className={'status status-' + o.status}>
            {o.status.replace(/_/g, ' ')}
          </span>
        )}

      </div>

      {/* TAP HINT */}
      <div className="admin-mobile-order-hint">
        Tap to view full details
      </div>

    </div>
  ))}

  {data.orders.length === 0 && (
    <div className="card pad center muted">
      No orders here
    </div>
  )}

</div>

      {openId && <OrderModal id={openId} onClose={() => setOpenId(null)} onChanged={load} />}
    </>
  );
}

function OrderModal({ id, onClose, onChanged }) {
  const { toast } = useAdmin();
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState(false);
  const [quote, setQuote] = useState('');

  const load = useCallback(() => apiFetch(`/api/admin/orders/${id}`).then((r) => setOrder(r.order)).catch(() => {}), [id]);
  useEffect(() => { load(); }, [load]);

  const act = async (body, message) => {
    setBusy(true);
    try {
      await apiFetch(`/api/admin/orders/${id}`, { method: 'PATCH', body });
      toast(message);
      load(); onChanged();
    } catch (e) { toast(e.message, 'err'); } finally { setBusy(false); }
  };

  if (!order) return null;
  const c = order.customization;

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal pad" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
        <div className="row-between">
          <div>
            <h3>{order.code}</h3>
            <div className="tiny muted">{new Date(order.created_at + 'Z').toLocaleString('en-IN')}</div>
          </div>
          <div className="row">
            <span className={'status status-' + order.status}>{order.status.replace(/_/g, ' ')}</span>
            <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={onClose}><Icon name="close" size={16} /></button>
          </div>
        </div>

        {/* --- quick actions the shop asked for: approve / cancel / delivered --- */}
        <div className="row wrap-gap" style={{ marginTop: 16, gap: 10 }}>
          {order.status === 'placed' && (
            <button className="btn btn-success btn-sm" disabled={busy} onClick={() => act({ status: 'approved' }, 'Order approved')}>
              <Icon name="check" size={15} /> Approve order
            </button>
          )}
          {['approved', 'baking', 'ready', 'out_for_delivery'].includes(order.status) && (
  <>
    {order.status === 'approved' && (
      <button
        className="btn btn-ghost btn-sm"
        disabled={busy}
        onClick={() => act({ status: 'baking' }, 'Marked as baking')}
      >
        Start baking
      </button>
    )}

    {order.status === 'baking' && (
      <button
        className="btn btn-ghost btn-sm"
        disabled={busy}
        onClick={() => act({ status: 'ready' }, 'Marked ready')}
      >
        Ready
      </button>
    )}

    {order.status === 'ready' && order.fulfilment === 'pickup' && (
      <button
        className="btn btn-sm"
        disabled={busy}
        onClick={() => act({ status: 'delivered' }, 'Marked delivered')}
      >
        <Icon name="check" size={15} /> Mark delivered
      </button>
    )}

    {order.status === 'ready' && order.fulfilment === 'delivery' && (
      <button
        className="btn btn-ghost btn-sm"
        disabled={busy}
        onClick={() => act({ status: 'out_for_delivery' }, 'Out for delivery')}
      >
        Send out for delivery
      </button>
    )}

    {order.status === 'out_for_delivery' && (
      <button
        className="btn btn-sm"
        disabled={busy}
        onClick={() => act({ status: 'delivered' }, 'Marked delivered')}
      >
        <Icon name="check" size={15} /> Mark delivered
      </button>
    )}
  </>
)}

          {!['delivered', 'cancelled'].includes(order.status) && (
            <button
            className="btn btn-danger btn-sm"
            disabled={busy}
            onClick={() => {
              const note = window.confirm('Cancel this order?\n\nReason: Out of stock');

              if (note) {
                act(
                  { status: 'cancelled', note: 'Out of stock' },
                  'Order cancelled — stock returned'
                );
              }
            }}
          >
            <Icon name="close" size={15} /> Cancel order
          </button>
          )}
          {order.payment_status !== 'paid' && (
            <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => act({ payment_status: 'paid' }, 'Payment marked received')}>
              <Icon name="rupee" size={15} /> Mark payment received
            </button>
          )}
        </div>

        {order.kind === 'custom' && (
          <div className="highlight-box" style={{ marginTop: 18 }}>
            <div className="row-between">
              <b>Custom cake brief</b>
              <span className="tag tag-eggless">Needs your quote</span>
            </div>
            <div className="grid grid-2" style={{ gap: 8, marginTop: 12 }}>
              {c && Object.entries(c).filter(([k]) => k !== 'quoted_price').map(([k, v]) => (
                <div key={k} className="row-between small" style={{ borderBottom: '1px dashed rgba(122,74,29,.2)', paddingBottom: 4 }}>
                  <span className="muted" style={{ textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
                  <b>{typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v) || '—'}</b>
                </div>
              ))}
            </div>
            {order.reference_image && (
              <div style={{ marginTop: 12 }}>
                <div className="tiny muted" style={{ marginBottom: 6 }}>Reference photo from the customer</div>
                <a href={order.reference_image} target="_blank" rel="noreferrer">
                  <img src={order.reference_image} alt="Reference" style={{ maxWidth: 220, borderRadius: 12 }} />
                </a>
              </div>
            )}
            <div className="row wrap-gap" style={{ marginTop: 14, gap: 10 }}>
              <input className="input" style={{ width: 160 }} type="number" placeholder={`Quote (₹${order.subtotal})`} value={quote} onChange={(e) => setQuote(e.target.value)} />
              <button className="btn btn-sm" disabled={!quote || busy} onClick={() => act({ quoted_price: Number(quote) }, 'Price updated')}>Update price</button>
            </div>
          </div>
        )}

        <div className="grid grid-2" style={{ gap: 16, marginTop: 18, alignItems: 'start' }}>
          <div className="card pad">
            <b className="small">Customer</b>
            <div className="stack tiny" style={{ marginTop: 8, gap: 6 }}>
              <span><b style={{ fontSize: '.9rem' }}>{order.customer}</b></span>
              <a className="row" href={`tel:${order.phone}`}><Icon name="phone" size={13} /> {order.phone}</a>
              <a className="row" href={`mailto:${order.email}`}><Icon name="mail" size={13} /> {order.email}</a>
              <span className="muted">{order.address}</span>
              {order.distance_km != null && <span className="muted">{order.distance_km} km from the shop</span>}
              <span className="muted">Customer since {new Date(order.customer_since + 'Z').toLocaleDateString('en-IN')}</span>
              <span className="muted">{order.customer_orders.c} orders · ₹{Math.round(order.customer_orders.v)} lifetime</span>
              <a className="btn btn-ghost btn-sm" style={{ marginTop: 6, width: 'fit-content' }}
                 href={`https://wa.me/91${String(order.phone).replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(`Hi ${order.customer}, about your order ${order.code} at Aadhis Cake Cafe…`)}`}
                 target="_blank" rel="noreferrer">
                <WhatsAppIcon size={14} /> Message on WhatsApp
              </a>
            </div>
          </div>

          <div className="card pad">
            <b className="small">Bill</b>
            <div className="stack tiny" style={{ marginTop: 8, gap: 6 }}>
              {order.items.map((i) => (
                <span key={i.id} className="row-between"><span>{i.name} × {i.qty}</span><b>₹{i.total}</b></span>
              ))}
              {order.kind === 'custom' && <span className="row-between"><span>Custom cake</span><b>₹{order.subtotal}</b></span>}
              <span className="row-between"><span className="muted">Delivery</span><b>₹{order.delivery_charge}</b></span>
              <span className="row-between" style={{ borderTop: '1px solid var(--line)', paddingTop: 6 }}>
                <b>Total</b><b>₹{order.total}</b>
              </span>
              <span className="row-between"><span className="muted">Method</span><b>{order.payment_method === 'cod' ? 'On handover' : 'Razorpay'}</b></span>
              <span className="row-between"><span className="muted">Payment</span><b style={{ textTransform: 'capitalize' }}>{order.payment_status}</b></span>
              {order.slot && <span className="row-between"><span className="muted">Preferred time</span><b>{order.slot}</b></span>}
              {order.notes && <span className="muted">Note: {order.notes}</span>}
            </div>
          </div>
        </div>

        <div className="card pad" style={{ marginTop: 16 }}>
          <b className="small">Timeline</b>
          <div className="stack tiny" style={{ marginTop: 10, gap: 8 }}>
            {order.events.map((e) => (
              <div key={e.id} className="row-between">
                <span><b style={{ textTransform: 'capitalize' }}>{e.status.replace(/_/g, ' ')}</b> — {e.note}</span>
                <span className="muted">{new Date(e.created_at + 'Z').toLocaleString('en-IN')} · {e.actor}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
