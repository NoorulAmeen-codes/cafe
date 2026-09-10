import { getDb } from '@/lib/db';
import { hashPassword, setSession } from '@/lib/auth';
import { handler, ok, fail, body } from '@/lib/api';
import { deliveryQuote } from '@/lib/geo';

export const dynamic = 'force-dynamic';

export const POST = handler(async (req) => {
  const b = await body(req);

  const name = String(b.name || '').trim();
  const phone = String(b.phone || '').replace(/\s+/g, '');
  const email = String(b.email || '').trim().toLowerCase();
  const password = String(b.password || '');
  const confirm = String(b.confirm_password || '');

  if (name.length < 2) return fail('Please enter your full name');
  if (name.length > 100) return fail('Name is too long');

  if (!/^(\\+91)?[6-9]\d{9}$/.test(phone)) {
    return fail('Enter a valid 10 digit Indian mobile number');
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return fail('Enter a valid email address');
  }

  if (email.length > 254) return fail('Email address is too long');

  if (password.length < 12) {
    return fail('Password must be at least 12 characters');
  }

  if (password.length > 128) {
    return fail('Password is too long');
  }

  if (password !== confirm) {
    return fail('Password and confirm password do not match');
  }

  const pincode = String(b.pincode || '').trim();

  if (!/^\d{6}$/.test(pincode)) {
    return fail('Enter a valid 6 digit pincode');
  }

  const city = String(b.city || '').trim();
  const locality = String(b.locality || '').trim();
  const state = String(b.state || 'Kerala').trim();
  const district = String(b.district || 'Palakkad').trim();
  const addressLine = String(b.address_line || '').trim();

  if (!city) return fail('City is required');
  if (!locality) return fail('Locality is required');

  if (city.length > 100) return fail('City name is too long');
  if (locality.length > 100) return fail('Locality name is too long');
  if (state.length > 100) return fail('State name is too long');
  if (district.length > 100) return fail('District name is too long');
  if (addressLine.length > 300) return fail('Address is too long');

  const lat = b.lat == null || b.lat === ''
    ? null
    : Number(b.lat);

  const lng = b.lng == null || b.lng === ''
    ? null
    : Number(b.lng);

  if (
    lat !== null &&
    (!Number.isFinite(lat) || lat < -90 || lat > 90)
  ) {
    return fail('Invalid latitude');
  }

  if (
    lng !== null &&
    (!Number.isFinite(lng) || lng < -180 || lng > 180)
  ) {
    return fail('Invalid longitude');
  }

  const db = getDb();

  if (db.prepare('SELECT id FROM users WHERE phone = ?').get(phone)) {
    return fail('An account already exists with this phone number');
  }

  if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
    return fail('An account already exists with this email');
  }

  const quote = deliveryQuote({
    lat,
    lng,
    pincode,
  });

  const info = db
    .prepare(
      `INSERT INTO users
      (name, phone, email, password, pincode, state, district, city, locality, address_line, lat, lng, distance_km)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
    )
    .run(
      name,
      phone,
      email,
      hashPassword(password),
      pincode,
      state,
      district,
      city,
      locality,
      addressLine,
      lat,
      lng,
      quote.distance_km
    );

  await setSession(info.lastInsertRowid);

  const user = db
    .prepare(
      'SELECT id,name,phone,email,role,pincode,state,district,city,locality,address_line,lat,lng,distance_km FROM users WHERE id = ?'
    )
    .get(info.lastInsertRowid);

  return ok({ user, quote });
});