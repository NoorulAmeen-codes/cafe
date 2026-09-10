/* Creates a few realistic customers and orders so the admin screens are not empty.
   Run with: node scripts/seed-demo.js   (safe to re-run: it clears demo data first) */
const path = require('path');
const Database = require('better-sqlite3');
const crypto = require('crypto');

const db = new Database(path.join(process.cwd(), 'data', 'app.db'));
const hash = (pw) => {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${crypto.scryptSync(pw, salt, 32).toString('hex')}`;
};

db.exec("DELETE FROM orders; DELETE FROM order_events; DELETE FROM users; DELETE FROM stock_moves; DELETE FROM reviews WHERE source = 'website';");

const customers = [
  { name: 'Anjali Krishnan', phone: '9847012345', email: 'anjali@example.com', pincode: '678687', city: 'Thachanady', locality: 'Puducode', lat: 10.6721, lng: 76.6467, distance_km: 0.4 },
  { name: 'Faisal Rahman', phone: '9895067890', email: 'faisal@example.com', pincode: '678688', city: 'Kannambra', locality: 'Kariyakunnu', lat: 10.7008, lng: 76.6249, distance_km: 4.5 },
  { name: 'Meera Nair', phone: '9605543210', email: 'meera@example.com', pincode: '678682', city: 'Parli', locality: 'Parli Bazaar', lat: 10.7566, lng: 76.6717, distance_km: 12.1 },
];

const insUser = db.prepare(`INSERT INTO users (name,phone,email,password,pincode,state,district,city,locality,address_line,lat,lng,distance_km,created_at)
  VALUES (@name,@phone,@email,@password,@pincode,'Kerala','Palakkad',@city,@locality,@address_line,@lat,@lng,@distance_km,datetime('now',@ago))`);
const ids = customers.map((c, i) =>
  insUser.run({ ...c, password: hash('demo1234'), address_line: 'House no ' + (12 + i * 7), ago: `-${30 - i * 8} days` }).lastInsertRowid
);

const P = (slug) => db.prepare('SELECT * FROM products WHERE slug = ?').get(slug);
const line = (slug, qty) => {
  const p = P(slug);
  return { id: p.id, slug: p.slug, name: p.name, unit: p.unit, price: p.price, qty, total: p.price * qty, image: p.image, note: '' };
};

const orders = [
  { u: 0, kind: 'catalog', fulfilment: 'delivery', status: 'placed', items: [line('chocolate-truffle-cake', 1), line('butter-croissant', 2)], delivery_charge: 30, distance_km: 0.4, ago: '-2 hours' },
  { u: 1, kind: 'custom', fulfilment: 'pickup', status: 'placed', items: [], subtotal: 1430, ago: '-5 hours',
    customization: { occasion: 'Birthday', flavour: 'Red Velvet', weight: '1.5 kg', shape: 'Heart', eggless: true, message_on_cake: 'Happy Birthday Ammu', colour_theme: 'Pastel pink & gold', tiers: 1, needed_on: '', extra_notes: 'Please avoid nuts', quoted_price: 1430 } },
  { u: 1, kind: 'catalog', fulfilment: 'delivery', status: 'out_for_delivery', items: [line('black-forest-cake', 1)], delivery_charge: 58, distance_km: 4.5, ago: '-1 day' },
  { u: 2, kind: 'catalog', fulfilment: 'pickup', status: 'delivered', items: [line('pistachio-cream-croissant', 2), line('classic-cold-coffee', 2)], ago: '-3 days', paid: 1 },
  { u: 0, kind: 'catalog', fulfilment: 'pickup', status: 'delivered', items: [line('red-velvet-cake', 1)], ago: '-6 days', paid: 1, reviewed: 1 },
  { u: 2, kind: 'catalog', fulfilment: 'delivery', status: 'cancelled', items: [line('strawberry-cheesecake', 1)], delivery_charge: 40, distance_km: 12.1, ago: '-8 days' },
];

const insOrder = db.prepare(`INSERT INTO orders
  (code,user_id,kind,fulfilment,status,items,customization,reference_image,notes,subtotal,delivery_charge,total,
   payment_method,payment_status,payment_ref,address,contact_phone,distance_km,slot,reviewed,created_at,updated_at)
  VALUES (@code,@user_id,@kind,@fulfilment,@status,@items,@customization,'','',@subtotal,@delivery_charge,@total,
   'cod',@payment_status,'',@address,@phone,@distance_km,'',@reviewed,datetime('now',@ago),datetime('now',@ago))`);
const insEvent = db.prepare("INSERT INTO order_events (order_id,status,note,actor,created_at) VALUES (?,?,?,?,datetime('now',?))");
const FLOW = {
  placed: ['placed'],
  approved: ['placed', 'approved'],
  out_for_delivery: ['placed', 'approved', 'baking', 'out_for_delivery'],
  delivered: ['placed', 'approved', 'baking', 'delivered'],
  cancelled: ['placed', 'cancelled'],
};

orders.forEach((o, i) => {
  const subtotal = o.subtotal ?? o.items.reduce((s, l) => s + l.total, 0);
  const u = customers[o.u];
  const id = insOrder.run({
    code: 'ACC' + String(100230 + i * 37), user_id: ids[o.u], kind: o.kind, fulfilment: o.fulfilment, status: o.status,
    items: JSON.stringify(o.items), customization: o.customization ? JSON.stringify(o.customization) : '',
    subtotal, delivery_charge: o.delivery_charge || 0, total: subtotal + (o.delivery_charge || 0),
    payment_status: o.paid ? 'paid' : 'pending',
    address: o.fulfilment === 'pickup' ? 'Pickup at store' : `${u.locality}, ${u.city}, Palakkad, Kerala, ${u.pincode}`,
    phone: u.phone, distance_km: o.distance_km || null, reviewed: o.reviewed || 0, ago: o.ago,
  }).lastInsertRowid;
  for (const st of FLOW[o.status] || ['placed']) {
    insEvent.run(id, st, `Order ${st.replace(/_/g, ' ')}`, st === 'placed' ? 'customer' : 'admin', o.ago);
  }
});

console.log(
  'Demo data ready:', db.prepare('SELECT COUNT(*) c FROM orders').get().c, 'orders,',
  db.prepare('SELECT COUNT(*) c FROM users').get().c, 'customers'
);
