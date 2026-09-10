import { getDb } from '@/lib/db';
import { currentUser, requireUser } from '@/lib/auth';
import { handler, ok, fail, body } from '@/lib/api';
import { deliveryQuote } from '@/lib/geo';

export const dynamic = 'force-dynamic';

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

/**
 * Lets a signed-in customer update their saved address / map pin.
 */
export const PUT = handler(async (req) => {
  const user = await requireUser();
  const b = await body(req);

  const name = String(b.name ?? user.name).trim();
  const pincode = String(b.pincode ?? user.pincode).trim();
  const state = String(b.state ?? user.state).trim();
  const district = String(b.district ?? user.district).trim();
  const city = String(b.city ?? user.city).trim();
  const locality = String(b.locality ?? user.locality).trim();
  const addressLine = String(
    b.address_line ?? user.address_line ?? ''
  ).trim();

  if (name.length < 2) {
    return fail('Please enter your full name');
  }

  if (name.length > 100) {
    return fail('Name is too long');
  }

  if (!/^\d{6}$/.test(pincode)) {
    return fail('Enter a valid 6 digit pincode');
  }

  if (!state) {
    return fail('State is required');
  }

  if (!district) {
    return fail('District is required');
  }

  if (!city) {
    return fail('City is required');
  }

  if (!locality) {
    return fail('Locality is required');
  }

  if (state.length > 100) {
    return fail('State name is too long');
  }

  if (district.length > 100) {
    return fail('District name is too long');
  }

  if (city.length > 100) {
    return fail('City name is too long');
  }

  if (locality.length > 100) {
    return fail('Locality name is too long');
  }

  if (addressLine.length > 300) {
    return fail('Address is too long');
  }

  const lat =
    b.lat == null || b.lat === ''
      ? user.lat
      : Number(b.lat);

  const lng =
    b.lng == null || b.lng === ''
      ? user.lng
      : Number(b.lng);

  if (
    lat != null &&
    (!Number.isFinite(lat) || lat < -90 || lat > 90)
  ) {
    return fail('Invalid latitude');
  }

  if (
    lng != null &&
    (!Number.isFinite(lng) || lng < -180 || lng > 180)
  ) {
    return fail('Invalid longitude');
  }

  const db = getDb();

  const quote = deliveryQuote({
    lat,
    lng,
    pincode,
  });

  db.prepare(
    `UPDATE users
     SET name=?, pincode=?, state=?, district=?, city=?, locality=?,
         address_line=?, lat=?, lng=?, distance_km=?
     WHERE id=?`
  ).run(
    name,
    pincode,
    state,
    district,
    city,
    locality,
    addressLine,
    lat,
    lng,
    quote.distance_km,
    user.id
  );

  const updated = db
    .prepare(
      `SELECT id,name,phone,email,role,pincode,state,district,city,
              locality,address_line,lat,lng,distance_km
       FROM users
       WHERE id=?`
    )
    .get(user.id);

  return ok({
    user: updated,
    quote,
  });
});