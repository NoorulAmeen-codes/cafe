import { logEvent } from '@/lib/db';
import { handler, ok, body, fail } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * Front-end crash / error reporter feeding the admin "Bugs & errors" screen.
 */
export const POST = handler(async (req) => {
  const b = await body(req);

  const message = String(b.message || 'Client error').slice(0, 500);
  const detail = String(b.detail || '').slice(0, 2000);
  const url = String(b.url || '').slice(0, 1000);

  const level = b.level === 'warn' ? 'warn' : 'error';

  logEvent({
    level,
    source: 'client',
    message,
    detail,
    url,
  });

  return ok();
});