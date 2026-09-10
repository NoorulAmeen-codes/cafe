import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { handler, ok } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = handler(async (req) => {
  await requireAdmin()
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'all';
  const q = (searchParams.get('q') || '').trim();

  let sql = `SELECT o.*, u.name AS customer, u.phone, u.email, u.locality, u.city, u.pincode
             FROM orders o JOIN users u ON u.id = o.user_id WHERE 1=1`;
  const args = [];
  if (status !== 'all') { sql += ' AND o.status = ?'; args.push(status); }
  if (q) {
    sql += ' AND (o.code LIKE ? OR u.name LIKE ? OR u.phone LIKE ?)';
    args.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  sql += ' ORDER BY o.id DESC LIMIT 200';

  const orders = db.prepare(sql).all(...args).map((o) => ({
    ...o,
    items: JSON.parse(o.items || '[]'),
    customization: o.customization ? safeParse(o.customization) : null,
  }));

  const counts = db
    .prepare('SELECT status, COUNT(*) c FROM orders GROUP BY status')
    .all()
    .reduce((acc, r) => ({ ...acc, [r.status]: r.c }), {});
  counts.all = db.prepare('SELECT COUNT(*) c FROM orders').get().c;

  return ok({ orders, counts });
});

function safeParse(s) {
  try { return JSON.parse(s); } catch { return { note: s }; }
}
