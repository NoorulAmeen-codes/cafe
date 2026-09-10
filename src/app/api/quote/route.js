import { handler, ok, body, fail } from '@/lib/api';
import { deliveryQuote } from '@/lib/geo';

export const dynamic = 'force-dynamic';

export const POST = handler(async (req) => {
  const b = await body(req);

  const lat = b.lat == null || b.lat === ''
    ? null
    : Number(b.lat);

  const lng = b.lng == null || b.lng === ''
    ? null
    : Number(b.lng);

  const subtotal = Number(b.subtotal);

  if (lat !== null && (!Number.isFinite(lat) || lat < -90 || lat > 90)) {
    return fail('Invalid latitude');
  }

  if (lng !== null && (!Number.isFinite(lng) || lng < -180 || lng > 180)) {
    return fail('Invalid longitude');
  }

  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return fail('Invalid subtotal');
  }

  const quote = deliveryQuote({
    lat,
    lng,
    pincode: b.pincode,
    subtotal,
  });

  return ok({ quote });
});