import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { handler, ok, fail, body, num, bool } from '@/lib/api';

export const dynamic = 'force-dynamic';


export const PUT = handler(async (req, { params }) => {
await requireAdmin();
  const { id } = await params;

  const b = await body(req);
  const db = getDb();
  const p = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!p) return fail('Product not found', 404);  
  const category = String(b.category ?? p.category).trim();

if (!category) {
  return fail('Pick a category');
}

const categoryExists = db
  .prepare('SELECT id FROM categories WHERE slug = ?')
  .get(category);

if (!categoryExists) {
  return fail('Invalid category');
}

  const next = {
    name: String(b.name ?? p.name),
    category,
    description: String(b.description ?? p.description),
    price: b.price != null ? num(b.price) : p.price,
    mrp: b.mrp === '' || b.mrp === null ? null : b.mrp != null ? num(b.mrp) : p.mrp,
    unit: String(b.unit ?? p.unit),
    image: String(b.image ?? p.image),
    veg: b.veg != null ? bool(b.veg) : p.veg,
    eggless: b.eggless != null ? bool(b.eggless) : p.eggless,
    bestseller: b.bestseller != null ? bool(b.bestseller) : p.bestseller,
    customizable: b.customizable != null ? bool(b.customizable) : p.customizable,
    low_stock_at: b.low_stock_at != null ? num(b.low_stock_at, 5) : p.low_stock_at,
    track_stock: b.track_stock != null ? bool(b.track_stock) : p.track_stock,
    active: b.active != null ? bool(b.active) : p.active,
    sort: b.sort != null ? num(b.sort) : p.sort,
  };
  if (!Number.isFinite(next.price) || next.price <= 0 || next.price > 1000000) {
  return fail('Price must be between ₹1 and ₹10,00,000');
  }
  if (next.mrp !== null) {
  if (!Number.isFinite(next.mrp) || next.mrp < 0 || next.mrp > 1000000) {
    return fail('MRP must be between ₹0 and ₹10,00,000');
  }

  if (next.mrp > 0 && next.mrp < next.price) {
    return fail('MRP cannot be lower than the selling price');
  }
}
let stockBalance = p.stock;

if (b.stock != null) {
  stockBalance = num(b.stock);

  if (
    !Number.isFinite(stockBalance) ||
    stockBalance < 0 ||
    stockBalance > 1000000
  ) {
    return fail('Stock must be between 0 and 10,00,000');
  }
}

  db.prepare(
    `UPDATE products SET name=?,category=?,description=?,price=?,mrp=?,unit=?,image=?,veg=?,eggless=?,
      bestseller=?,customizable=?,low_stock_at=?,track_stock=?,active=?,sort=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`
  ).run(
    next.name, next.category, next.description, next.price, next.mrp, next.unit, next.image,
    next.veg, next.eggless, next.bestseller, next.customizable, next.low_stock_at,
    next.track_stock, next.active, next.sort, p.id
  );

  // Stock is adjusted through an explicit move so the history stays truthful.
  if (b.stock != null && stockBalance !== p.stock) {
  db.prepare(
    'UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(stockBalance, p.id);

  db.prepare(
    'INSERT INTO stock_moves (product_id, delta, reason, balance) VALUES (?,?,?,?)'
  ).run(
    p.id,
    stockBalance - p.stock,
    String(b.stock_reason || 'Manual adjustment'),
    stockBalance
  );
}

  return ok({ product: db.prepare('SELECT * FROM products WHERE id = ?').get(p.id) });
});

/** Quick stock nudge (+/-) used by the stock screen. */
export const PATCH = handler(async (req, { params }) => {
  await requireAdmin();
  const { id } = await params;

  const b = await body(req);
  const db = getDb();
  const p = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!p) return fail('Product not found', 404);
  const delta = num(b.delta);

if (!Number.isFinite(delta) || delta < -1000000 || delta > 1000000) {
  return fail('Stock adjustment must be between -10,00,000 and 10,00,000');
}

const balance = p.stock + delta;

if (balance < 0 || balance > 1000000) {
  return fail('Resulting stock must be between 0 and 10,00,000');
}
  db.prepare(
  'UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
).run(balance, p.id);
  db.prepare('INSERT INTO stock_moves (product_id, delta, reason, balance) VALUES (?,?,?,?)')
    .run(p.id, balance - p.stock, String(b.reason || (delta > 0 ? 'Restock' : 'Wastage')), balance);
  return ok({ product: db.prepare('SELECT * FROM products WHERE id = ?').get(p.id) });
});

export const DELETE = handler(async (req, { params }) => {
  await requireAdmin();
  const { id } = await params;

  const db = getDb();
  const p = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!p) return fail('Product not found', 404);

  db.prepare(
    'UPDATE products SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(p.id);

  return ok({
    product: db.prepare('SELECT * FROM products WHERE id = ?').get(p.id),
  });
});

export const GET = handler(async (req, { params }) => {
  await requireAdmin();
  const { id } = await params;

  const db = getDb();
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!product) return fail('Product not found', 404);
  const moves = db.prepare('SELECT * FROM stock_moves WHERE product_id = ? ORDER BY id DESC LIMIT 30').all(product.id);
  return ok({ product, moves });
});
