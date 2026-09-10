import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { handler, ok, fail, body } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = handler(async () => {
  await requireAdmin();
  const db = getDb();
  const reviews = db
    .prepare(`SELECT r.*, u.name AS user_name, o.code AS order_code
              FROM reviews r LEFT JOIN users u ON u.id = r.user_id
              LEFT JOIN orders o ON o.id = r.order_id ORDER BY r.id DESC LIMIT 200`)
    .all();
  return ok({ reviews });
});

export const POST = handler(async (req) => {
  await requireAdmin();
  const b = await body(req);
const db = getDb();

const author = String(b.author || 'Guest').trim();
const text = String(b.text || '').trim();
const rating = Number(b.rating);

if (!author) {
  return fail('Review author is required');
}

if (author.length > 120) {
  return fail('Review author is too long');
}

if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
  return fail('Rating must be between 1 and 5');
}

if (text.length > 2000) {
  return fail('Review text is too long');
}

const info = db
  .prepare(
    'INSERT INTO reviews (author, rating, text, source, posted_on, published) VALUES (?,?,?,?,?,1)'
  )
  .run(
    author,
    rating,
    text,
    'google',
    String(b.posted_on || '')
  );
  return ok({ review: db.prepare('SELECT * FROM reviews WHERE id = ?').get(info.lastInsertRowid) });
});

export const PATCH = handler(async (req) => {
  await requireAdmin();

  const b = await body(req);
  const id = Number(b.id);

  if (!Number.isInteger(id) || id < 1) {
    return fail('Invalid review ID');
  }

  const published = b.published ? 1 : 0;
  const db = getDb();

  const review = db
    .prepare('SELECT id FROM reviews WHERE id = ?')
    .get(id);

  if (!review) {
    return fail('Review not found', 404);
  }

  db.prepare(
    'UPDATE reviews SET published = ? WHERE id = ?'
  ).run(published, id);

  return ok();
});

export const DELETE = handler(async (req) => {
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));

  if (!Number.isInteger(id) || id < 1) {
    return fail('Invalid review ID');
  }

  const db = getDb();

  const review = db
    .prepare('SELECT id FROM reviews WHERE id = ?')
    .get(id);

  if (!review) {
    return fail('Review not found', 404);
  }

  db.prepare('DELETE FROM reviews WHERE id = ?').run(id);

  return ok();
});
