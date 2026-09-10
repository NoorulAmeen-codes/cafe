import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { handler, ok, body } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = handler(async (req) => {
  requireAdmin();
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const resolved = searchParams.get('resolved');
  const sql = resolved === '1'
    ? 'SELECT * FROM logs ORDER BY id DESC LIMIT 200'
    : 'SELECT * FROM logs WHERE resolved = 0 ORDER BY id DESC LIMIT 200';
  const logs = db.prepare(sql).all();
  const open = db.prepare('SELECT COUNT(*) c FROM logs WHERE resolved = 0').get().c;
  return ok({ logs, open });
});

export const PATCH = handler(async (req) => {
  requireAdmin();
  const b = await body(req);
  const db = getDb();
  if (b.all) db.prepare('UPDATE logs SET resolved = 1').run();
  else db.prepare('UPDATE logs SET resolved = ? WHERE id = ?').run(b.resolved ? 1 : 0, b.id);
  return ok();
});

export const DELETE = handler(async (req) => {
  requireAdmin();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const db = getDb();
  if (id) db.prepare('DELETE FROM logs WHERE id = ?').run(id);
  else db.prepare('DELETE FROM logs WHERE resolved = 1').run();
  return ok();
});
