> Notes for the developer / shop owner — Aadhis Cake Cafe website

# Aadhis Cake Cafe — bakery website

Full-stack bakery shop for **Aadhis Cake Cafe**, Puducode, Thachanady, Palakkad (Kerala) 678687.
Next.js 14 (App Router) + SQLite (better-sqlite3). No external services required — maps use
OpenStreetMap/Leaflet, distance checks are calculated locally.

## Run it

```bash
cd bakery
npm install
npm run dev      # http://localhost:3000
npm run build && npm start   # production
```

* Shop front: `/`
* Admin panel: `/admin` — admin credentials are configured through environment variables.
* Demo data: `node scripts/seed-demo.js` (wipes orders/customers, keeps the catalogue)

The database file is `data/app.db`; it is created and seeded automatically on first run.
Uploaded photos (custom-cake references, product/slide images) go to `public/uploads/`.

## What the customer can do

| Feature | Where |
|---|---|
| 3 sliding carousels (auto + arrows + dots) | `/` |
| Browse all products, filters, search, sort, eggless-only | `/menu` |
| Product detail with rating, stock, related items | `/product/[slug]` |
| Custom cake order with occasion/flavour/weight/shape/tiers/message, live price estimate and **reference image upload** | `/custom-cake` |
| Google reviews block + rating summary + "write on Google" | `/` |
| Pickup **or** home delivery choice, with live distance + charge | `/checkout` |
| Map (shop pin + delivery circle) linked to Google Maps directions | `/`, `/checkout`, `/account` |
| Registration: name, phone, email, password, confirm password, pincode, state (Kerala default), district (Palakkad default), city, locality — plus a draggable map pin | `/register` |
| Range check "can you deliver to me?" before ordering | `/register`, `/checkout`, `/account` |
| Dashboard: orders, payments, statuses, timeline, cancel, address editing | `/account` |
| Review nudge on the next visit after delivery → hands over to Google | pops up site-wide |
| WhatsApp button (floating + per product + per order) | everywhere |

## What the admin can do (`/admin`)

| Screen | Covers |
|---|---|
| **Dashboard** | today's orders/revenue, pending approvals, delivered/cancelled, stock alerts, 7-day sales bars, best sellers, one-tap delivery on/off |
| **Orders** | filter by status, search, full detail: customer, items, **customisation highlighted**, reference photo, bill, timeline. Actions: **approve**, start baking, ready/out for delivery, **mark delivered**, **cancel** (returns stock), mark payment received, quote a custom cake |
| **Products & stock** | add / edit / delete, price + MRP (discount badge), photo upload, veg/eggless/bestseller/customisable flags, show-hide on site, stock on hand with +/- quick mode, low-stock threshold, per-product stock history |
| **Customers** | every registered user, contact, address, pinned location, distance from shop, lifetime value and full order history with customisation details |
| **Carousel** | edit/add/delete/reorder slides, live preview, image upload, headline/subtitle/button |
| **Delivery & location** | delivery **on/off for today**, radius slider (shown as a circle on the map), base + per-km charge, free-above, minimum order, charge preview table, pincode tester, and a **draggable map pin for the exact shop location** |
| **Reviews** | publish/hide/delete reviews, add Google reviews manually, set the Google review + listing links and displayed rating |
| **Colours & layout** | recolour the entire site (presets + per-colour pickers, live preview), heading font, corner roundness, and **reorder / hide homepage sections** |
| **Bugs & errors** | automatic feed of client crashes, failed API calls and server errors with stack trace + page; resolve / reopen / clear |
| **Shop settings** | shop name, tagline, hours, description, phone, **WhatsApp number**, email, payments (COD + Razorpay keys, UPI id), admin username/password |

## How the delivery range works

`src/lib/geo.js` holds the logic:

1. The customer's point comes from their **map pin** (exact) or, if absent, a lookup table of
   ~30 Palakkad-area pincodes.
2. Straight-line distance to the shop (haversine) × `ROUTE_FACTOR` (1.25) to approximate road distance.
3. In range if `distance <= delivery.radius_km`, and the charge is
   `base_charge + per_km_charge × (distance − 1)`, free when the subtotal passes `free_above`.
4. Orders outside the radius are refused server-side too, not just in the UI, and pickup stays available.

To switch to Google Distance Matrix later, replace `deliveryQuote()` — the API shape
(`{ ok, in_range, distance_km, charge, reason }`) is what the rest of the app consumes.

## Stock behaviour

* Placing an order reserves stock immediately and writes a row in `stock_moves`.
* Cancelling (by the customer or the shop) returns it.
* Ordering more than the stock on hand is rejected with the exact quantity left.
* Products can opt out with `track_stock = 0` (e.g. drinks made to order).

## Payments

Razorpay is wired as a **stub**: enabling it in Shop settings shows the online option at checkout
and marks those orders paid with a `rzp_test_…` reference. Add real keys and swap the block marked
`// ---- payment ----` in `src/app/api/orders/route.js` for a live Razorpay order call.

## Project layout

```
src/lib/          db.js (schema+settings) · seed.js · auth.js (scrypt + signed cookies) · geo.js · api.js
src/components/   Providers (store/cart/toasts) · SiteChrome (header/footer/WhatsApp) · ProductCard
                  MapView (Leaflet) · ReviewPrompt · AdminShell (+ImageInput) · Icon
src/app/          public pages, /admin pages, /api routes
scripts/          seed-demo.js
```

## Known follow-ups

* 8 product photos are placeholder SVGs / stock images (donut, cupcakes, butter cookies,
  cold coffee, milkshake, breads) — replace them in **Admin → Products → Edit → Upload**.
* Order status changes are shown in the customer dashboard; wiring an actual WhatsApp Business
  API push (instead of the prefilled `wa.me` links) is the natural next step.
* Reviews shown on the homepage are seeded/manually managed — the Google Places API needs a
  billed key to pull them live.
