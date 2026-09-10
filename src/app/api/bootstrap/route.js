import { getDb, allSettings } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { handler, ok } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = handler(async () => {
  const db = getDb();
  const settings = allSettings();
  delete settings.admin;
  if (settings.payments) {
    settings.payments = {
      cod_enabled: settings.payments.cod_enabled,
      razorpay_enabled: settings.payments.razorpay_enabled,
      razorpay_key_id: settings.payments.razorpay_key_id,
      upi_id: settings.payments.upi_id,
    };
  }

  const products = db
    .prepare('SELECT * FROM products WHERE active = 1 ORDER BY sort, id')
    .all();
  const categories = db
    .prepare('SELECT * FROM categories WHERE active = 1 ORDER BY sort, id')
    .all();
  const carousels = db
    .prepare('SELECT * FROM carousels WHERE active = 1 ORDER BY sort, id')
    .all();
  const reviews = db
    .prepare('SELECT id,author,rating,text,source,posted_on FROM reviews WHERE published = 1 ORDER BY id DESC LIMIT 12')
    .all();

  const user = currentUser();

  // Any delivered order that has not been asked for a review yet.
  let pendingReview = null;
  if (user) {
    pendingReview = db
      .prepare(
        `SELECT id, code, items FROM orders
         WHERE user_id = ? AND status = 'delivered' AND reviewed = 0
         ORDER BY id DESC LIMIT 1`
      )
      .get(user.id) || null;
  }

  return ok({ settings, products, categories, carousels, reviews, user, pendingReview });
});
