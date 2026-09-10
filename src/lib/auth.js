import crypto from 'crypto';
import { cookies } from 'next/headers';
import { getDb, getSetting } from './db.js';

const SECRET = process.env.APP_SECRET;

if (!SECRET || SECRET.length < 32) {
  throw new Error(
    'APP_SECRET must be set and must be at least 32 characters long.'
  );
}

const COOKIE = 'acc_session';
const ADMIN_COOKIE = 'acc_admin';

export function hashPassword(
  password,
  salt = crypto.randomBytes(16).toString('hex')
) {
  const hash = crypto
    .scryptSync(String(password), salt, 32)
    .toString('hex');

  return `${salt}:${hash}`;
}

export function verify(password, stored) {
  if (!stored || !stored.includes(':')) return false;

  const [salt, hash] = stored.split(':');

  const test = crypto
    .scryptSync(String(password), salt, 32)
    .toString('hex');

  return crypto.timingSafeEqual(
    Buffer.from(hash, 'hex'),
    Buffer.from(test, 'hex')
  );
}

function sign(payload) {
  const body = Buffer
    .from(JSON.stringify(payload))
    .toString('base64url');

  const sig = crypto
    .createHmac('sha256', SECRET)
    .update(body)
    .digest('base64url');

  return `${body}.${sig}`;
}

function unsign(token) {
  if (!token || !token.includes('.')) return null;

  const [body, sig] = token.split('.');

  const expected = crypto
    .createHmac('sha256', SECRET)
    .update(body)
    .digest('base64url');

  if (sig !== expected) return null;

  try {
    const data = JSON.parse(
      Buffer.from(body, 'base64url').toString()
    );

    if (!data.expiresAt) {
      return null;
    }

    if (Date.now() > data.expiresAt) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export async function setSession(userId) {
  const cookieStore = await cookies();
  const now = Date.now();
  const expiresAt = now + (7 * 24 * 60 * 60 * 1000);

  cookieStore.set(COOKIE, sign({ uid: userId, createdAt: now, expiresAt }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE);
}

export async function currentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  const data = unsign(token);

  if (!data?.uid) return null;

  const user = getDb().prepare(
    'SELECT id,name,phone,email,role,pincode,state,district,city,locality,address_line,lat,lng,distance_km,created_at FROM users WHERE id = ?'
  ).get(data.uid);

  return user || null;
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  const now = Date.now();
  const expiresAt = now + (12 * 60 * 60 * 1000);

  cookieStore.set(ADMIN_COOKIE, sign({ admin: true, createdAt: now, expiresAt }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

export async function isAdmin() {
  const cookieStore = await cookies();
  const data = unsign(cookieStore.get(ADMIN_COOKIE)?.value);

  return Boolean(data?.admin);
}

export function checkAdminCredentials(username, password) {
  const admin = getSetting('admin');

  if (!admin?.username || !admin?.password) {
    return false;
  }

  if (username !== admin.username) {
    return false;
  }

  return verify(password, admin.password);
}

export async function requireAdmin() {
  if (!(await isAdmin())) {
    const err = new Error('Admin authentication required');
    err.status = 401;
    throw err;
  }

  return true;
}

export async function requireUser() {
  const user = await currentUser();

  if (!user) {
    const err = new Error('Please sign in to continue');
    err.status = 401;
    throw err;
  }

  return user;
}