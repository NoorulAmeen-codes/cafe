import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { handler, ok, fail } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = handler(async (req) => {
  await requireAdmin();
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

if (id) {
  const userId = Number(id);

  if (!Number.isInteger(userId) || userId < 1) {
    return fail('Invalid customer ID', 400);
  }
    const user = db
      .prepare('SELECT id,name,phone,email,pincode,state,district,city,locality,address_line,lat,lng,distance_km,created_at FROM users WHERE id = ?')
      .get(userId);
    if (!user) return fail('Customer not found', 404);
    user.orders = db
      .prepare('SELECT id,code,status,kind,fulfilment,total,payment_method,payment_status,created_at,customization,items FROM orders WHERE user_id = ? ORDER BY id DESC')
      .all(userId)
      .map((o) => {
  let items = [];

  try {
    items = JSON.parse(o.items || '[]');
  } catch {
    items = [];
  }

  return { ...o, items };
});
    user.summary = db
      .prepare("SELECT COUNT(*) orders, COALESCE(SUM(total),0) spent FROM orders WHERE user_id = ? AND status != 'cancelled'")
      .get(userId);
    return ok({ user });
  }

  const q = (searchParams.get('q') || '').trim();
  let sql = `SELECT u.id,u.name,u.phone,u.email,u.city,u.locality,u.pincode,u.district,u.distance_km,u.created_at,
                    COUNT(o.id) AS orders,
                    COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total ELSE 0 END),0) AS spent,
                    MAX(o.created_at) AS last_order
             FROM users u LEFT JOIN orders o ON o.user_id = u.id`;
  const args = [];
  if (q) { sql += ' WHERE (u.name LIKE ? OR u.phone LIKE ? OR u.email LIKE ?)'; args.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  sql += ' GROUP BY u.id ORDER BY u.id DESC LIMIT 200';

  return ok({ users: db.prepare(sql).all(...args) });
});
