import { getDb } from '@/lib/db';
import {
  verify,
  setSession,
  clearSession,
  currentUser,
} from '@/lib/auth';
import { handler, ok, fail, body } from '@/lib/api';
import { deliveryQuote } from '@/lib/geo';

export const dynamic = 'force-dynamic';

export const POST = handler(async (req) => {
  const b = await body(req);

  const id = String(b.identifier || '').trim().toLowerCase();
  const password = String(b.password || '');

  if (!id) {
    return fail('Enter your phone number or email');
  }

  if (id.length > 254) {
    return fail('Phone number or email is too long');
  }

  if (!password) {
    return fail('Enter your password');
  }

  if (password.length > 128) {
    return fail('Password is too long');
  }

  const db = getDb();

  const user = db
    .prepare(
      'SELECT * FROM users WHERE lower(email) = ? OR phone = ?'
    )
    .get(id, id.replace(/\s+/g, ''));

  if (!user || !verify(password, user.password)) {
    return fail('Wrong phone/email or password', 401);
  }

  await setSession(user.id);

  delete user.password;

  return ok({ user });
});

export const DELETE = handler(async () => {
  await clearSession();
  return ok();
});

export const GET = handler(async () => {
  const user = await currentUser();

  if (!user) {
    return ok({ user: null });
  }

  const quote = deliveryQuote({
    lat: user.lat,
    lng: user.lng,
    pincode: user.pincode,
  });

  return ok({ user, quote });
});