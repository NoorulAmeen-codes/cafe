import { getDb } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handler, ok, fail, body } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = handler(async (req, { params }) => {
  const user = await requireUser();
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(params.id, user.id);
  if (!order) return fail('Order not found', 404);
  order.items = JSON.parse(order.items || '[]');
  order.events = db.prepare('SELECT status, note, created_at FROM order_events WHERE order_id = ? ORDER BY id').all(order.id);
  return ok({ order });
});

/** Customer-side actions: cancel while it is still pending, or dismiss the review nudge. */
export const PATCH = handler(async (req, { params }) => {
  const user = await requireUser();
  const b = await body(req);
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(params.id, user.id);
  if (!order) return fail('Order not found', 404);

  if (b.action === 'cancel') {
    const cancelReason = String(b.reason || 'Cancelled by customer').trim();

if (cancelReason.length > 300) {
  return fail('Cancellation reason is too long');
}
    if (!['placed', 'approved'].includes(order.status))
      return fail('This order can no longer be cancelled. Please call the shop.');
    const items = JSON.parse(order.items || '[]');
    db.transaction(() => {
      db.prepare("UPDATE orders SET status='cancelled', cancel_reason=?, updated_at=CURRENT_TIMESTAMP WHERE id=?")
        .run(cancelReason, order.id);
      for (const it of items) {
        const p = db.prepare('SELECT stock, track_stock FROM products WHERE id = ?').get(it.id);
        if (p?.track_stock) {
          const balance = p.stock + it.qty;
          db.prepare('UPDATE products SET stock = ? WHERE id = ?').run(balance, it.id);
          db.prepare('INSERT INTO stock_moves (product_id, delta, reason, balance) VALUES (?,?,?,?)')
            .run(it.id, it.qty, `Cancelled ${order.code}`, balance);
        }
      }
      db.prepare('INSERT INTO order_events (order_id, status, note, actor) VALUES (?,?,?,?)')
        .run(order.id, 'cancelled', cancelReason, 'customer');
    })();
    return ok();
  }

  if (b.action === 'dismiss_review') {
    db.prepare('UPDATE orders SET reviewed = 1 WHERE id = ?').run(order.id);
    return ok();
  }

  return fail('Unknown action');
});
