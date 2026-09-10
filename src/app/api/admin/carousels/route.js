import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { handler, ok, fail, body, num, bool } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = handler(async () => {
  requireAdmin();
  const slides = getDb().prepare('SELECT * FROM carousels ORDER BY sort, id').all();
  return ok({ slides });
});

export const POST = handler(async (req) => {
  requireAdmin();
  const b = await body(req);
  const db = getDb();
  const maxSort = db.prepare('SELECT COALESCE(MAX(sort),0) s FROM carousels').get().s;
  const info = db
    .prepare(
      `INSERT INTO carousels (eyebrow,title,title_accent,subtitle,cta_label,cta_href,image,sort,active)
       VALUES (?,?,?,?,?,?,?,?,?)`
    )
    .run(
      String(b.eyebrow || ''), String(b.title || 'New slide'), String(b.title_accent || ''),
      String(b.subtitle || ''), String(b.cta_label || 'Order Now'), String(b.cta_href || '/menu'),
      String(b.image || ''), maxSort + 1, bool(b.active ?? 1)
    );
  return ok({ slide: db.prepare('SELECT * FROM carousels WHERE id = ?').get(info.lastInsertRowid) });
});

export const PUT = handler(async (req) => {
  requireAdmin();
  const b = await body(req);
  const db = getDb();
  const s = db.prepare('SELECT * FROM carousels WHERE id = ?').get(b.id);
  if (!s) return fail('Slide not found', 404);
  db.prepare(
    `UPDATE carousels SET eyebrow=?,title=?,title_accent=?,subtitle=?,cta_label=?,cta_href=?,image=?,sort=?,active=? WHERE id=?`
  ).run(
    String(b.eyebrow ?? s.eyebrow), String(b.title ?? s.title), String(b.title_accent ?? s.title_accent),
    String(b.subtitle ?? s.subtitle), String(b.cta_label ?? s.cta_label), String(b.cta_href ?? s.cta_href),
    String(b.image ?? s.image), b.sort != null ? num(b.sort) : s.sort,
    b.active != null ? bool(b.active) : s.active, s.id
  );
  return ok({ slide: db.prepare('SELECT * FROM carousels WHERE id = ?').get(s.id) });
});

export const DELETE = handler(async (req) => {
  requireAdmin();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const db = getDb();
  if (db.prepare('SELECT COUNT(*) c FROM carousels').get().c <= 1)
    return fail('Keep at least one slide on the homepage');
  db.prepare('DELETE FROM carousels WHERE id = ?').run(id);
  return ok();
});
