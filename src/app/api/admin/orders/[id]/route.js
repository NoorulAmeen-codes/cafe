import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { handler, ok, fail, body } from '@/lib/api';

export const dynamic = 'force-dynamic';

const FLOW = ['placed', 'approved', 'baking', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
const LABEL = {
  approved: 'Order approved by the bakery',
  baking: 'Your bake is in the oven',
  ready: 'Ready at the counter for pickup',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered — enjoy!',
  cancelled: 'Order cancelled',
};

export const GET = handler(async (req, { params }) => {
  await requireAdmin();

  const { id } = await params;

  const db = getDb();
  const order = db
    .prepare(
      `SELECT o.*, u.name AS customer, u.phone, u.email, u.pincode, u.state, u.district, u.city,
              u.locality, u.address_line, u.lat, u.lng, u.created_at AS customer_since
       FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = ?`
    )
    .get(id);
  if (!order) return fail('Order not found', 404);
  order.items = JSON.parse(order.items || '[]');
  try { order.customization = order.customization ? JSON.parse(order.customization) : null; }
  catch { order.customization = { note: order.customization }; }
  order.events = db.prepare('SELECT * FROM order_events WHERE order_id = ? ORDER BY id').all(order.id);
  order.customer_orders = db
    .prepare("SELECT COUNT(*) c, COALESCE(SUM(total),0) v FROM orders WHERE user_id = ? AND status != 'cancelled'")
    .get(order.user_id);
  return ok({ order });
});

export const PATCH = handler(async (req, { params }) => {
  await requireAdmin();

  const { id } = await params;
  const b = await body(req);
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) return fail('Order not found', 404);

  if (b.payment_status) {
  const paymentStatus = String(b.payment_status);

  if (!['pending', 'paid', 'failed', 'refunded'].includes(paymentStatus)) {
    return fail('Invalid payment status');
  }

  db.prepare('UPDATE orders SET payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(paymentStatus, order.id);

  db.prepare('INSERT INTO order_events (order_id, status, note, actor) VALUES (?,?,?,?)')
    .run(order.id, order.status, `Payment marked ${paymentStatus}`, 'admin');
  }
  if (b.quoted_price != null && order.kind === 'custom') {
    const price = Number(b.quoted_price);

  if (!Number.isFinite(price) || price < 1 || price > 100000) {
  return fail('Invalid quoted price');
  }
    const total = price + order.delivery_charge;
    db.prepare('UPDATE orders SET subtotal = ?, total = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(price, total, order.id);
    db.prepare('INSERT INTO order_events (order_id, status, note, actor) VALUES (?,?,?,?)')
      .run(order.id, order.status, `Custom cake quoted at ₹${price}`, 'admin');
  }

  if (b.status) {
  const status = String(b.status);
  const note = String(b.note || '').trim();

if (note.length > 300) {
  return fail('Order note is too long');
}

  if (!FLOW.includes(status)) return fail('Unknown status');

  const allowedNext = {
    placed: ['approved', 'cancelled'],
    approved: ['baking', 'cancelled'],
    baking: ['ready', 'cancelled'],
    ready: order.fulfilment === 'delivery'
      ? ['out_for_delivery', 'cancelled']
      : ['delivered', 'cancelled'],
    out_for_delivery: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: [],
  };

  if (!allowedNext[order.status]?.includes(status)) {
    return fail(`Cannot change order from ${order.status} to ${status}`);
  }

    const updateOrder = db.transaction(() => {
      // Cancelling returns the reserved stock to the shelf.
      if (status === 'cancelled' && order.status !== 'cancelled') {
        for (const it of JSON.parse(order.items || '[]')) {
          const p = db.prepare('SELECT stock, track_stock FROM products WHERE id = ?').get(it.id);
          if (p?.track_stock) {
            const balance = p.stock + it.qty;
            db.prepare('UPDATE products SET stock = ? WHERE id = ?').run(balance, it.id);
            db.prepare('INSERT INTO stock_moves (product_id, delta, reason, balance) VALUES (?,?,?,?)')
              .run(it.id, it.qty, `Cancelled ${order.code}`, balance);
          }
        }
      }
      const paid = status === 'delivered' && order.payment_method === 'cod' ? 'paid' : order.payment_status;
      db.prepare('UPDATE orders SET status = ?, payment_status = ?, cancel_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(
      status,
      paid,
      status === 'cancelled' ? (note || 'Cancelled by shop') : order.cancel_reason,
      order.id
    );
      db.prepare('INSERT INTO order_events (order_id, status, note, actor) VALUES (?,?,?,?)')
        .run(order.id, status, note || LABEL[status] || '', 'admin');
    });

updateOrder();
  }

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);
  updated.items = JSON.parse(updated.items || '[]');
  return ok({ order: updated });
});
