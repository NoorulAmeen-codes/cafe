import { getDb, getSetting } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { handler, ok } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = handler(async () => {
  await requireAdmin();
  const db = getDb();
  const one = (sql, ...args) => db.prepare(sql).get(...args);

  const today = new Date().toISOString().slice(0, 10);
  const revenue = one("SELECT COALESCE(SUM(total),0) v FROM orders WHERE status != 'cancelled'").v;
  const todayRevenue = one(
    "SELECT COALESCE(SUM(total),0) v FROM orders WHERE status != 'cancelled' AND date(created_at) = ?", today
  ).v;

  const stats = {
    orders_total: one('SELECT COUNT(*) c FROM orders').c,
    orders_today: one('SELECT COUNT(*) c FROM orders WHERE date(created_at) = ?', today).c,
    pending: one("SELECT COUNT(*) c FROM orders WHERE status = 'placed'").c,
    baking: one("SELECT COUNT(*) c FROM orders WHERE status IN ('approved','baking','ready','out_for_delivery')").c,
    delivered: one("SELECT COUNT(*) c FROM orders WHERE status = 'delivered'").c,
    cancelled: one("SELECT COUNT(*) c FROM orders WHERE status = 'cancelled'").c,
    revenue, revenue_today: todayRevenue,
    customers: one('SELECT COUNT(*) c FROM users').c,
    products: one('SELECT COUNT(*) c FROM products').c,
    out_of_stock: one('SELECT COUNT(*) c FROM products WHERE track_stock = 1 AND stock <= 0').c,
    low_stock: one('SELECT COUNT(*) c FROM products WHERE track_stock = 1 AND stock > 0 AND stock <= low_stock_at').c,
    open_bugs: one('SELECT COUNT(*) c FROM logs WHERE resolved = 0').c,
    custom_requests: one("SELECT COUNT(*) c FROM orders WHERE kind = 'custom' AND status = 'placed'").c,
  };

  const recentOrders = db
    .prepare(
      `SELECT o.id,o.code,o.status,o.kind,o.fulfilment,o.total,o.created_at,u.name AS customer,u.phone
       FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.id DESC LIMIT 8`
    )
    .all();

  const lowStock = db
    .prepare('SELECT id,name,stock,low_stock_at,unit FROM products WHERE track_stock = 1 AND stock <= low_stock_at ORDER BY stock ASC LIMIT 8')
    .all();

  const salesByDay = db
    .prepare(
      `SELECT date(created_at) d, COUNT(*) orders, COALESCE(SUM(total),0) total
       FROM orders WHERE status != 'cancelled' AND created_at >= date('now','-6 days')
       GROUP BY date(created_at) ORDER BY d`
    )
    .all();

  const topProducts = db
    .prepare(
      `SELECT p.name, p.stock, COUNT(sm.id) moves, COALESCE(-SUM(sm.delta),0) sold
       FROM products p LEFT JOIN stock_moves sm ON sm.product_id = p.id AND sm.delta < 0
       GROUP BY p.id ORDER BY sold DESC LIMIT 5`
    )
    .all();

  return ok({
    stats, recentOrders, lowStock, salesByDay, topProducts,
    delivery: getSetting('delivery', {}),
  });
});
