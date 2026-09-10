import { getDb, getSetting } from '@/lib/db';
import { requireUser, currentUser } from '@/lib/auth';
import { handler, ok, fail, body } from '@/lib/api';
import { deliveryQuote } from '@/lib/geo';

export const dynamic = 'force-dynamic';

export const GET = handler(async () => {
  const user = await currentUser();
  if (!user) return ok({ orders: [] });
  const db = getDb();
  const orders = db
    .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC')
    .all(user.id)
    .map((o) => ({ ...o, items: JSON.parse(o.items || '[]') }));
  for (const o of orders) {
    o.events = db.prepare('SELECT status, note, created_at FROM order_events WHERE order_id = ? ORDER BY id').all(o.id);
  }
  return ok({ orders });
});

export const POST = handler(async (req) => {
  const user = await requireUser();
  const b = await body(req);
  const db = getDb();

  const kind = b.kind === 'custom' ? 'custom' : 'catalog';
  const fulfilment = b.fulfilment === 'delivery' ? 'delivery' : 'pickup';
  const delivery = getSetting('delivery', {});
  const payments = getSetting('payments', {});

  // ---- items + stock validation -------------------------------------------
  const rawItems = Array.isArray(b.items) ? b.items : [];
  const items = [];
  let subtotal = 0;

  for (const line of rawItems) {
    const qty = Math.max(1, Math.min(50, Number(line.qty) || 1));
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(line.id);
    if (!product) return fail(`One of the items is no longer available`);
    if (product.track_stock && product.stock < qty)
      return fail(`Only ${product.stock} left of ${product.name}. Please reduce the quantity.`);
    const lineTotal = product.price * qty;
    subtotal += lineTotal;
    items.push({
      id: product.id, slug: product.slug, name: product.name, unit: product.unit,
      price: product.price, qty, total: lineTotal, image: product.image,
      note: String(line.note || '').slice(0, 300),
    });
  }

  if (kind === 'catalog' && items.length === 0) return fail('Your basket is empty');

  // ---- custom cake --------------------------------------------------------
let customization = '';

if (kind === 'custom') {
  const c = b.customization || {};

  if (!c.flavour || !c.weight) {
    return fail('Please pick a flavour and a weight for your cake');
  }

  const allowedFlavours = [
    'Chocolate Truffle',
    'Red Velvet',
    'Black Forest',
    'Butterscotch',
    'Pineapple',
    'Vanilla',
    'Blueberry',
    'Fresh Fruit',
  ];

  const allowedWeights = {
    '500 g': 450,
    '1 kg': 750,
    '1.5 kg': 1100,
    '2 kg': 1450,
    '3 kg': 2150,
  };

  const allowedShapes = [
    'Round',
    'Square',
    'Heart',
    'Number',
    'Custom shape',
  ];

  if (!allowedFlavours.includes(c.flavour)) {
    return fail('Invalid cake flavour');
  }

  if (!Object.prototype.hasOwnProperty.call(allowedWeights, c.weight)) {
    return fail('Invalid cake weight');
  }

  if (!allowedShapes.includes(c.shape || 'Round')) {
    return fail('Invalid cake shape');
  }

  const tiers = Number(c.tiers);

  if (!Number.isInteger(tiers) || tiers < 1 || tiers > 3) {
    return fail('Invalid number of tiers');
  }

  const occasion = String(c.occasion || '').slice(0, 50);
  const flavour = c.flavour;
  const weight = c.weight;
  const shape = c.shape || 'Round';
  const eggless =
  c.eggless === true ||
  c.eggless === 1 ||
  c.eggless === 'true' ||
  c.eggless === '1';
  const messageOnCake = String(c.message_on_cake || '').slice(0, 60);
  const colourTheme = String(c.colour_theme || '').slice(0, 100);
  const neededOn = String(c.needed_on || '').slice(0, 20);
  const extraNotes = String(c.extra_notes || '').slice(0, 500);

  // Calculate the estimate on the SERVER.
  // Never trust quoted_price sent by the browser.
  let estimatedPrice = allowedWeights[weight];

  if (['Fresh Fruit', 'Blueberry', 'Red Velvet'].includes(flavour)) {
    estimatedPrice += 120;
  }

  if (eggless) {
    estimatedPrice += 60;
  }

  if (shape === 'Heart' || shape === 'Number') {
    estimatedPrice += 150;
  }

  if (shape === 'Custom shape') {
    estimatedPrice += 300;
  }

  estimatedPrice += (tiers - 1) * 450;

  if (b.reference_image) {
    estimatedPrice += 100;
  }

  estimatedPrice = Math.round(estimatedPrice);

  customization = JSON.stringify({
    occasion,
    flavour,
    weight,
    shape,
    eggless,
    message_on_cake: messageOnCake,
    colour_theme: colourTheme,
    tiers,
    needed_on: neededOn,
    extra_notes: extraNotes,
    quoted_price: estimatedPrice,
  });

  subtotal = estimatedPrice;

} else if (b.customization && Object.keys(b.customization).length) {
  customization = JSON.stringify(b.customization);
}
  // ---- fulfilment / delivery ---------------------------------------------
  let deliveryCharge = 0;
  let distance = null;
  let address = '';

  if (fulfilment === 'delivery') {
    if (delivery.enabled_today === false)
      return fail(delivery.off_reason || 'Home delivery is switched off for today. Please choose pickup.');
    const quote = deliveryQuote({
  lat: user.lat,
  lng: user.lng,
  pincode: user.pincode,
  subtotal,
});
    if (!quote.resolved) return fail(quote.reason);
    if (!quote.in_range) return fail(quote.reason, 400, { quote });
    if (delivery.min_order && subtotal < Number(delivery.min_order))
      return fail(`Minimum order for home delivery is ₹${delivery.min_order}`);
    deliveryCharge = quote.charge;
    distance = quote.distance_km;
    address = [
  user.address_line,
  user.locality,
  user.city,
  `${user.district} District`,
  user.state,
  user.pincode,
].filter(Boolean).join(', ');
  } else {
    address = 'Pickup at store — ' + (getSetting('shop', {}).address || '');
  }
  // ---- order input validation --------------------------------------------
const notes = String(b.notes || '').trim();
const slot = String(b.slot || '').trim();
const referenceImage = String(b.reference_image || '').trim();

if (referenceImage.length > 500) {
  return fail('Reference image value is too long');
}

if (
  referenceImage &&
  !/^\/uploads\/[A-Za-z0-9._-]+$/.test(referenceImage)
) {
  return fail('Invalid reference image');
}

if (slot.length > 100) {
  return fail('Preferred time is too long');
}

if (referenceImage.length > 500) {
  return fail('Reference image value is too long');
}

// Customers cannot choose another phone number for an order.
// Always use the authenticated account's phone number.
const contactPhone = user.phone;

if (!contactPhone) {
  return fail('Your account does not have a valid phone number');
}

  const total = Math.max(0, subtotal + deliveryCharge);

  // ---- payment ------------------------------------------------------------
let paymentMethod = b.payment_method === 'razorpay' ? 'razorpay' : 'cod';

if (paymentMethod === 'razorpay') {
  return fail(
    'Online payments are temporarily unavailable. Please choose Pay on pickup / delivery.'
  );
}

if (paymentMethod === 'cod' && payments.cod_enabled === false) {
  return fail(
    'Cash / UPI on handover is currently unavailable. Please choose another payment method.'
  );
}

const paymentStatus = 'pending';
const paymentRef = '';

  const code = 'ACC' + String(Date.now()).slice(-6) + Math.floor(Math.random() * 90 + 10);

  const create = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO orders
         (code,user_id,kind,fulfilment,status,items,customization,reference_image,notes,subtotal,delivery_charge,total,
          payment_method,payment_status,payment_ref,address,contact_phone,distance_km,slot)
         VALUES (?,?,?,?,'placed',?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
      )
      .run(
        code, user.id, kind, fulfilment, JSON.stringify(items), customization,
        referenceImage, notes,
        subtotal, deliveryCharge, total, paymentMethod, paymentStatus, paymentRef,
        address, contactPhone, distance, slot
      );
    const orderId = info.lastInsertRowid;

    for (const it of items) {
      const p = db.prepare('SELECT stock, track_stock FROM products WHERE id = ?').get(it.id);
      if (p.track_stock) {
        const balance = p.stock - it.qty;
        db.prepare('UPDATE products SET stock = ? WHERE id = ?').run(balance, it.id);
        db.prepare('INSERT INTO stock_moves (product_id, delta, reason, balance) VALUES (?,?,?,?)')
          .run(it.id, -it.qty, `Order ${code}`, balance);
      }
    }

    db.prepare('INSERT INTO order_events (order_id, status, note, actor) VALUES (?,?,?,?)')
      .run(orderId, 'placed', 'Order received and waiting for the bakery to confirm', 'customer');
    return orderId;
  });

  const orderId = create();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  order.items = JSON.parse(order.items || '[]');
  return ok({ order });
});
