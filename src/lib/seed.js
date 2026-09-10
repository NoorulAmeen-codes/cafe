import crypto from 'crypto';
function hashSeedPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, 32).toString('hex');
  return `${salt}:${hash}`;
}
const DEFAULT_SETTINGS = {
  shop: {
    name: 'Aadhis Cake Cafe',
    tagline: 'LIVE CAKE',
    blurb:
      'Live cakes and fresh bakes, made to order at Puducode, Thachanady. Pickup or home delivery where available.',
    phone: '+91 97476 14864',
    whatsapp: '919747614864',
    email: 'hello@aadhiscakecafe.com',
    address: 'Puducode, Puducode, Thachanady, Palakkad, Kerala, 678687',
    landmark: '2 min walk from KSRTC bus stand',
    hours: 'Open Daily · 8:00 AM – 10:00 PM',
    lat: 10.6721,
    lng: 76.6467,
    map_zoom: 15,
    google_review_url: 'https://search.google.com/local/writereview?placeid=aadhis-cake-cafe',
    google_listing_url: 'https://www.google.com/maps/search/Aadhis+Cake+Cafe+Puducode+Palakkad',
    google_rating: 4.8,
    google_review_count: 222,
  },
  delivery: {
    enabled_today: true,
    off_reason: 'Home delivery is paused for today. Pickup orders are still open.',
    radius_km: 5,
    base_charge: 30,
    per_km_charge: 8,
    free_above: 999,
    min_order: 199,
    prep_time: 'Pickup ready in ~2 hours',
    pickup_enabled: true,
  },
  payments: {
    cod_enabled: true,
    razorpay_enabled: false,
    razorpay_key_id: '',
    razorpay_key_secret: '',
    upi_id: 'aadhiscakecafe@upi',
  },
  theme: {
    primary: '#7a4a1d',
    accent: '#f0b429',
    bg: '#fdf6e8',
    surface: '#ffffff',
    text: '#3b2a17',
    muted: '#8a7860',
    success: '#1e8e5a',
    danger: '#d64545',
    radius: 18,
    font_heading: "'Fraunces', Georgia, serif",
    font_body: "'Nunito', system-ui, sans-serif",
  },
  layout: {
    sections: [
      { id: 'hero', label: 'Hero carousel', visible: true },
      { id: 'categories', label: 'Shop by category', visible: true },
      { id: 'products', label: 'Fresh from the oven', visible: true },
      { id: 'custom', label: 'Custom cake banner', visible: true },
      { id: 'reviews', label: 'Google reviews', visible: true },
      { id: 'bestsellers', label: 'Popular picks strip', visible: true },
      { id: 'map', label: 'Find us / map', visible: true },
      { id: 'usp', label: 'Why choose us', visible: true },
    ],
  },
 admin: { username: 'admin' },};

const CATEGORIES = [
  { slug: 'cakes', name: 'Cakes', icon: 'cake', sort: 1 },
  { slug: 'pastries', name: 'Pastries', icon: 'croissant', sort: 2 },
  { slug: 'cookies', name: 'Cookies', icon: 'cookie', sort: 3 },
  { slug: 'breads', name: 'Breads', icon: 'bread', sort: 4 },
  { slug: 'drinks', name: 'Drinks', icon: 'cup', sort: 5 },
];

const PRODUCTS = [
  {
    slug: 'chocolate-truffle-cake', name: 'Chocolate Truffle Cake', category: 'cakes',
    description: 'Dark Belgian chocolate sponge layered with silky truffle ganache and finished with chocolate shavings. Our most-ordered birthday cake, three years running.',
    price: 699, mrp: 899, unit: '1 kg', image: '/img/chocolate-truffle-cake.jpg',
    eggless: 1, bestseller: 1, customizable: 1, stock: 12, rating: 4.9, rating_count: 214, sort: 1,
  },
  {
    slug: 'red-velvet-cake', name: 'Red Velvet Cake', category: 'cakes',
    description: 'Classic red velvet sponge with tangy cream cheese frosting and velvet crumb finish.',
    price: 649, mrp: 749, unit: '1 kg', image: '/img/red-velvet-cake.jpg',
    bestseller: 1, customizable: 1, stock: 8, rating: 4.8, rating_count: 168, sort: 2,
  },
  {
    slug: 'black-forest-cake', name: 'Black Forest Cake', category: 'cakes',
    description: 'Chocolate sponge soaked in cherry syrup, layered with whipped cream and dark chocolate curls.',
    price: 699, unit: '1 kg', image: '/img/black-forest-cake.jpg',
    customizable: 1, stock: 6, rating: 4.7, rating_count: 121, sort: 3,
  },
  {
    slug: 'blueberry-cheesecake', name: 'Blueberry Cheesecake', category: 'cakes',
    description: 'Baked New York style cheesecake on a biscuit base, topped with a thick blueberry compote.',
    price: 699, unit: '500 g', image: '/img/blueberry-cheesecake.jpg',
    stock: 5, rating: 4.8, rating_count: 96, sort: 4,
  },
  {
    slug: 'strawberry-cheesecake', name: 'Strawberry Cheesecake', category: 'cakes',
    description: 'Chilled cheesecake crowned with fresh strawberries and a glossy berry glaze.',
    price: 749, unit: '500 g', image: '/img/strawberry-cheesecake.jpg',
    stock: 4, rating: 4.9, rating_count: 74, sort: 5,
  },
  {
    slug: 'chocolate-pastry', name: 'Chocolate Pastry', category: 'pastries',
    description: 'Single-serve chocolate pastry with ganache glaze and a cherry on top.',
    price: 79, unit: '1 piece', image: '/img/chocolate-pastry.jpg',
    bestseller: 1, stock: 30, rating: 4.7, rating_count: 302, sort: 6,
  },
  {
    slug: 'pistachio-cream-croissant', name: 'Pistachio Cream Croissant', category: 'pastries',
    description: 'Flaky croissant filled with pistachio cream and dusted with crushed pistachios.',
    price: 149, unit: '1 piece', image: '/img/pistachio-croissant.jpg',
    bestseller: 1, stock: 18, rating: 4.9, rating_count: 143, sort: 7,
  },
  {
    slug: 'butter-croissant', name: 'Butter Croissant', category: 'pastries',
    description: 'All-butter croissant, laminated over 18 hours and baked fresh every morning.',
    price: 89, unit: '1 piece', image: '/img/butter-croissant.jpg',
    bestseller: 1, stock: 24, rating: 4.8, rating_count: 209, sort: 8,
  },
  {
    slug: 'double-fudge-brownie', name: 'Double Fudge Brownie', category: 'pastries',
    description: 'Dense fudgy brownie with molten chocolate chunks and a crackled top.',
    price: 89, unit: '1 piece', image: '/img/brownie.jpg',
    stock: 22, rating: 4.7, rating_count: 154, sort: 9,
  },
  {
    slug: 'classic-glazed-donut', name: 'Classic Glazed Donut', category: 'pastries',
    description: 'Soft brioche donut dipped in chocolate glaze with vanilla drizzle.',
    price: 59, unit: '1 piece', image: '/img/donut.svg',
    stock: 26, rating: 4.6, rating_count: 187, sort: 10,
  },
  {
    slug: 'vanilla-cupcakes', name: 'Vanilla Cupcakes (4 pcs)', category: 'pastries',
    description: 'Box of four vanilla cupcakes with swirled buttercream in party colours.',
    price: 249, unit: 'box of 4', image: '/img/cupcakes.svg',
    eggless: 1, stock: 10, rating: 4.8, rating_count: 88, sort: 11,
  },
  {
    slug: 'choco-chip-cookies', name: 'Choco Chip Cookies', category: 'cookies',
    description: 'Chunky chocolate chip cookies, crisp at the edge and chewy in the middle. Jar of 8.',
    price: 199, unit: 'jar of 8', image: '/img/cookies.jpg',
    eggless: 1, stock: 16, rating: 4.8, rating_count: 121, sort: 12,
  },
  {
    slug: 'butter-cookies', name: 'Danish Butter Cookies', category: 'cookies',
    description: 'Melt-in-the-mouth butter cookies baked in the classic Danish style. Jar of 10.',
    price: 189, unit: 'jar of 10', image: '/img/butter-cookies.svg',
    eggless: 1, stock: 14, rating: 4.7, rating_count: 64, sort: 13,
  },
  {
    slug: 'sourdough-loaf', name: 'Sourdough Loaf', category: 'breads',
    description: 'Naturally leavened 24-hour sourdough with a crackling crust and open crumb.',
    price: 169, unit: '600 g', image: '/img/sourdough.jpg',
    eggless: 1, stock: 9, rating: 4.9, rating_count: 88, sort: 14,
  },
  {
    slug: 'whole-wheat-bread', name: 'Whole Wheat Bread', category: 'breads',
    description: 'Soft 100% whole wheat sandwich loaf, no maida, baked every morning.',
    price: 179, mrp: 188, unit: '400 g', image: '/img/wheat-bread.jpg',
    eggless: 1, stock: 12, rating: 4.6, rating_count: 71, sort: 15,
  },
  {
    slug: 'multigrain-buns', name: 'Multigrain Burger Buns', category: 'breads',
    description: 'Pack of four seeded multigrain buns, perfect for burgers and sliders.',
    price: 149, unit: 'pack of 4', image: '/img/buns.jpg',
    eggless: 1, stock: 11, rating: 4.6, rating_count: 39, sort: 16,
  },
  {
    slug: 'classic-cold-coffee', name: 'Classic Cold Coffee', category: 'drinks',
    description: 'Chilled cold coffee blended thick with milk and a shot of house espresso.',
    price: 129, unit: '350 ml', image: '/img/cold-coffee.svg',
    eggless: 1, stock: 40, rating: 4.7, rating_count: 176, sort: 17,
  },
  {
    slug: 'oreo-milkshake', name: 'Oreo Milkshake', category: 'drinks',
    description: 'Thick shake blended with cookies and cream, topped with whipped cream.',
    price: 149, unit: '400 ml', image: '/img/milkshake.svg',
    eggless: 1, stock: 35, rating: 4.8, rating_count: 132, sort: 18,
  },
];

const CAROUSELS = [
  {
    eyebrow: 'FRESHLY BAKED', title: 'Live making,', title_accent: 'Baked for You',
    subtitle: 'Delicious cakes, pastries & more — out of the oven every single morning.',
    cta_label: 'Order Now', cta_href: '/menu', image: '/img/hero-1.jpg', sort: 1,
  },
  {
    eyebrow: 'TODAY AT THE COUNTER', title: 'Warm bakes,', title_accent: 'Every Morning',
    subtitle: 'Croissants, sourdough and brownies ready for pickup in about two hours.',
    cta_label: 'See the menu', cta_href: '/menu', image: '/img/hero-2.jpg', sort: 2,
  },
  {
    eyebrow: 'MADE TO ORDER', title: 'Custom cakes,', title_accent: 'Your Way',
    subtitle: 'Send us a reference photo and we will bake your idea for the big day.',
    cta_label: 'Design your cake', cta_href: '/custom-cake', image: '/img/hero-3.jpg', sort: 3,
  },
];

const REVIEWS = [
  { author: 'Meera Nair', rating: 5, posted_on: '1 Sep 2026', text: 'Quick pickup, warm croissants and the WhatsApp order update made it so easy. My go-to bakery now.' },
  { author: 'Anjali Krishnan', rating: 5, posted_on: '28 Aug 2026', text: "Ordered the chocolate truffle for my daughter's birthday — the eggless version tastes even better than the regular one. Soft, rich and not too sweet." },
  { author: 'Faisal Rahman', rating: 5, posted_on: '23 Aug 2026', text: 'Best cake cafe in Thachanady, hands down. The pistachio croissant is flaky perfection and the sourdough has a real crust. Staff packed everything neatly.' },
  { author: 'Divya S', rating: 5, posted_on: '20 Aug 2026', text: 'Used them for our anniversary — sent a reference photo on WhatsApp and they matched the theme exactly. Delivery reached on time to Kannambra.' },
  { author: 'Rahul Menon', rating: 4, posted_on: '14 Aug 2026', text: 'Good quality bakes and fair prices. Cold coffee is excellent. Would love a few more sugar-free options.' },
  { author: 'Sneha Pillai', rating: 5, posted_on: '9 Aug 2026', text: 'The red velvet was gone in ten minutes at the party. Ordering on the site took two minutes and pickup was ready when promised.' },
];

export function seed(db) {
  const settingsCount = db.prepare('SELECT COUNT(*) c FROM settings').get().c;
  if (settingsCount === 0) {
  const initialAdminPassword = process.env.ADMIN_INITIAL_PASSWORD;

  if (!initialAdminPassword || initialAdminPassword.length < 12) {
    throw new Error(
      'ADMIN_INITIAL_PASSWORD must be set and must be at least 12 characters long.'
    );
  }

  const settings = {
    ...DEFAULT_SETTINGS,
    admin: {
      username: DEFAULT_SETTINGS.admin.username,
      password: hashSeedPassword(initialAdminPassword),
    },
  };

  const stmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');

  for (const [k, v] of Object.entries(settings)) {
    stmt.run(k, JSON.stringify(v));
  }
}

  if (db.prepare('SELECT COUNT(*) c FROM categories').get().c === 0) {
    const stmt = db.prepare('INSERT INTO categories (slug, name, icon, sort) VALUES (?,?,?,?)');
    for (const c of CATEGORIES) stmt.run(c.slug, c.name, c.icon, c.sort);
  }

  if (db.prepare('SELECT COUNT(*) c FROM products').get().c === 0) {
    const stmt = db.prepare(`INSERT INTO products
      (slug,name,category,description,price,mrp,unit,image,veg,eggless,bestseller,customizable,stock,rating,rating_count,sort)
      VALUES (@slug,@name,@category,@description,@price,@mrp,@unit,@image,@veg,@eggless,@bestseller,@customizable,@stock,@rating,@rating_count,@sort)`);
    for (const p of PRODUCTS) {
      stmt.run({
        mrp: null, veg: 1, eggless: 0, bestseller: 0, customizable: 0,
        rating: 4.7, rating_count: 0, sort: 0, ...p,
      });
    }
  }

  if (db.prepare('SELECT COUNT(*) c FROM carousels').get().c === 0) {
    const stmt = db.prepare(`INSERT INTO carousels
      (eyebrow,title,title_accent,subtitle,cta_label,cta_href,image,sort)
      VALUES (@eyebrow,@title,@title_accent,@subtitle,@cta_label,@cta_href,@image,@sort)`);
    for (const c of CAROUSELS) stmt.run(c);
  }

  if (db.prepare('SELECT COUNT(*) c FROM reviews').get().c === 0) {
    const stmt = db.prepare('INSERT INTO reviews (author, rating, text, source, posted_on) VALUES (?,?,?,?,?)');
    for (const r of REVIEWS) stmt.run(r.author, r.rating, r.text, 'google', r.posted_on);
  }
}

export { DEFAULT_SETTINGS };
