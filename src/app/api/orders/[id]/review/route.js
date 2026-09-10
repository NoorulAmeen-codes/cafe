import { getDb, getSetting } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handler, ok, fail, body } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * Saves the star rating a customer leaves after delivery and hands back the
 * Google review link so the same feedback can be posted on the listing.
 */
export const POST = handler(async (req, { params }) => {
  const user = await requireUser();
  const b = await body(req);
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(params.id, user.id);
  if (!order) return fail('Order not found', 404);
  if (order.status !== 'delivered') return fail('You can review an order once it is delivered');
  if (order.reviewed) return fail('You have already reviewed this order');

  const rating = Number(b.rating);

if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
  return fail('Rating must be between 1 and 5');
}
  const text = String(b.text || '').slice(0, 800);
  const shop = getSetting('shop', {});

  db.transaction(() => {
    db.prepare(
      'INSERT INTO reviews (author, rating, text, source, posted_on, order_id, user_id, published) VALUES (?,?,?,?,?,?,?,?)'
    ).run(
      user.name, rating, text, 'website',
      new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      order.id, user.id, rating >= 4 ? 1 : 0
    );
    db.prepare('UPDATE orders SET reviewed = 1, review_prompted = 1 WHERE id = ?').run(order.id);
  })();

  const googleUrl = shop.google_review_url || shop.google_listing_url || '';
  return ok({ google_review_url: googleUrl, prefill: text });
});
