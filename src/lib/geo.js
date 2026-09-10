import { getSetting } from './db.js';

/** Approximate centroids for pincodes / localities around the shop (Palakkad district). */
export const PINCODE_POINTS = {
  678687: { name: 'Puducode / Thachanady', lat: 10.6721, lng: 76.6467 },
  678688: { name: 'Kannambra', lat: 10.7008, lng: 76.6249 },
  678684: { name: 'Kongad', lat: 10.8083, lng: 76.5806 },
  678685: { name: 'Mundur', lat: 10.8244, lng: 76.6242 },
  678682: { name: 'Parli', lat: 10.7566, lng: 76.6717 },
  678683: { name: 'Peringottukurussi', lat: 10.7716, lng: 76.5867 },
  678732: { name: 'Vadakkenchery', lat: 10.6389, lng: 76.4667 },
  678702: { name: 'Alathur', lat: 10.6431, lng: 76.5514 },
  678703: { name: 'Vandazhy', lat: 10.6, lng: 76.6 },
  678721: { name: 'Kuthannur', lat: 10.6883, lng: 76.5533 },
  678551: { name: 'Nemmara', lat: 10.5883, lng: 76.6 },
  678001: { name: 'Palakkad Town', lat: 10.7867, lng: 76.6548 },
  678002: { name: 'Palakkad Fort', lat: 10.7739, lng: 76.6533 },
  678011: { name: 'Kalmandapam', lat: 10.7756, lng: 76.6489 },
  678013: { name: 'Chandranagar', lat: 10.7803, lng: 76.6297 },
  678014: { name: 'Marutharoad', lat: 10.7961, lng: 76.6672 },
  678005: { name: 'Olavakkode', lat: 10.7889, lng: 76.6392 },
  678006: { name: 'Kunnathurmedu', lat: 10.7772, lng: 76.6717 },
  678101: { name: 'Chittur', lat: 10.7, lng: 76.75 },
  678103: { name: 'Kozhinjampara', lat: 10.6667, lng: 76.85 },
  678501: { name: 'Malampuzha', lat: 10.8333, lng: 76.6833 },
  678503: { name: 'Puthur', lat: 10.7628, lng: 76.6942 },
  678507: { name: 'Kodumba', lat: 10.7833, lng: 76.7167 },
  678508: { name: 'Pudussery', lat: 10.7833, lng: 76.7667 },
  679303: { name: 'Ottapalam', lat: 10.7728, lng: 76.3781 },
  679513: { name: 'Cherpulassery', lat: 10.8783, lng: 76.3117 },
  678591: { name: 'Kollengode', lat: 10.6167, lng: 76.6917 },
  678592: { name: 'Muthalamada', lat: 10.5667, lng: 76.7833 },
  678641: { name: 'Pattambi', lat: 10.8067, lng: 76.1961 },
  678611: { name: 'Elappully', lat: 10.7167, lng: 76.6667 },
};

export function haversineKm(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return null;
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Road distance is longer than straight line: apply a routing factor. */
export const ROUTE_FACTOR = 1.25;

export function shopPoint() {
  const shop = getSetting('shop', {});
  return { lat: Number(shop.lat) || 10.6721, lng: Number(shop.lng) || 76.6467 };
}

export function resolvePoint({ lat, lng, pincode }) {
  if (lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))) {
    return { lat: Number(lat), lng: Number(lng), source: 'pin' };
  }
  const hit = PINCODE_POINTS[String(pincode || '').trim()];
  if (hit) return { lat: hit.lat, lng: hit.lng, source: 'pincode', name: hit.name };
  return null;
}

/**
 * Works out whether an address is deliverable and what it costs.
 */
export function deliveryQuote({ lat, lng, pincode, subtotal = 0 }) {
  const delivery = getSetting('delivery', {});
  const point = resolvePoint({ lat, lng, pincode });
  const shop = shopPoint();

  if (!point) {
    return {
      ok: false, resolved: false, distance_km: null, charge: 0,
      radius_km: delivery.radius_km,
      reason: 'We could not locate that address. Pick your spot on the map or enter a valid pincode.',
    };
  }

  const straight = haversineKm(shop, point);
  const distance = Math.round(straight * ROUTE_FACTOR * 10) / 10;
  const radius = Number(delivery.radius_km ?? 5);
  const inRange = distance <= radius;

  let charge = 0;
  if (inRange) {
    const base = Number(delivery.base_charge ?? 0);
    const perKm = Number(delivery.per_km_charge ?? 0);
    charge = Math.round(base + perKm * Math.max(0, distance - 1));
    if (delivery.free_above && subtotal >= Number(delivery.free_above)) charge = 0;
  }

  return {
    ok: inRange && delivery.enabled_today !== false,
    resolved: true,
    in_range: inRange,
    delivery_open: delivery.enabled_today !== false,
    off_reason: delivery.off_reason || '',
    distance_km: distance,
    radius_km: radius,
    charge,
    free_above: delivery.free_above,
    min_order: delivery.min_order,
    place: point.name || null,
    source: point.source,
    reason: !inRange
      ? `Sorry — that address is ${distance} km away and we currently deliver within ${radius} km. You can still place a pickup order.`
      : delivery.enabled_today === false
      ? delivery.off_reason || 'Home delivery is off today.'
      : '',
  };
}
