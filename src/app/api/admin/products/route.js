import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { handler, ok, fail, body, num, bool, slugify } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = handler(async () => {
  await requireAdmin()
  const db = getDb();
  const products = db.prepare('SELECT * FROM products ORDER BY sort, id').all();
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort, id').all();
  return ok({ products, categories });
});

export const POST = handler(async (req) => {
  await requireAdmin()
  const b = await body(req);
  const db = getDb();
  const name = String(b.name || '').trim();
  if (!name) return fail('Product name is required');
  const category = String(b.category || '').trim();

if (!category) {
  return fail('Pick a category');
}

const categoryExists = db
  .prepare('SELECT id FROM categories WHERE slug = ?')
  .get(category);

if (!categoryExists) {
  return fail('Invalid category');
}
  const price = num(b.price);

if (!Number.isFinite(price) || price <= 0 || price > 1000000) {
  return fail('Price must be between ₹1 and ₹10,00,000');
}
const stock = num(b.stock);
const lowStockAt = num(b.low_stock_at, 5);
const mrp = b.mrp === '' || b.mrp == null ? null : num(b.mrp);

if (!Number.isFinite(stock) || stock < 0 || stock > 1000000) {
  return fail('Stock must be between 0 and 10,00,000');
}

if (!Number.isFinite(lowStockAt) || lowStockAt < 0 || lowStockAt > 1000000) {
  return fail('Low-stock threshold is invalid');
}
if (mrp !== null) {
  if (!Number.isFinite(mrp) || mrp < 0 || mrp > 1000000) {
    return fail('MRP must be between ₹0 and ₹10,00,000');
  }

  if (mrp > 0 && mrp < price) {
    return fail('MRP cannot be lower than the selling price');
  }
}
  let slug = b.slug ? slugify(b.slug) : slugify(name);
  let i = 2;
  while (db.prepare('SELECT id FROM products WHERE slug = ?').get(slug)) slug = `${slugify(name)}-${i++}`;

  const maxSort = db.prepare('SELECT COALESCE(MAX(sort),0) s FROM products').get().s;
  const rating = num(b.rating, 4.7);
    const ratingCount = num(b.rating_count);

    if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
    return fail('Rating must be between 0 and 5');
    }

    if (!Number.isFinite(ratingCount) || ratingCount < 0 || ratingCount > 10000000) {
    return fail('Rating count is invalid');
    }
  const info = db
    .prepare(
      `INSERT INTO products (slug,name,category,description,price,mrp,unit,image,veg,eggless,bestseller,customizable,
        stock,low_stock_at,track_stock,rating,rating_count,active,sort)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    )
    .run(
      slug, name, category, String(b.description || ''), price,
      mrp, String(b.unit || '1 piece'), String(b.image || ''),
      bool(b.veg ?? 1), bool(b.eggless), bool(b.bestseller), bool(b.customizable),
      stock, lowStockAt, bool(b.track_stock ?? 1),
      rating, ratingCount, bool(b.active ?? 1), maxSort + 1
    );

  if (stock > 0) {
    db.prepare('INSERT INTO stock_moves (product_id, delta, reason, balance) VALUES (?,?,?,?)')
      .run(info.lastInsertRowid, stock, 'Opening stock', stock);
  }

  return ok({ product: db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid) });
});
