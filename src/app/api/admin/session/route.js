import {
  checkAdminCredentials,
  setAdminSession,
  clearAdminSession,
  isAdmin,
} from '@/lib/auth';
import { handler, ok, fail, body } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = handler(async () => {
  return ok({ admin: await isAdmin() });
});

export const POST = handler(async (req) => {
  const b = await body(req);

  if (
    !checkAdminCredentials(
      String(b.username || ''),
      String(b.password || '')
    )
  ) {
    return fail('Wrong admin username or password', 401);
  }

  await setAdminSession();

  return ok();
});

export const DELETE = handler(async () => {
  await clearAdminSession();

  return ok();
});