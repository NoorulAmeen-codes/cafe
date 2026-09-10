'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import SiteChrome from '@/components/SiteChrome';
import ProductCard, { priceOff } from '@/components/ProductCard';
import { useStore } from '@/components/Providers';
import { Icon, Stars, WhatsAppIcon } from '@/components/Icon';

export default function ProductPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { products, cart, addToCart, setQty, shop, delivery, ready, toast } = useStore();

  const product = useMemo(() => products.find((p) => p.slug === slug), [products, slug]);
  const related = useMemo(
    () => products.filter((p) => product && p.category === product.category && p.id !== product.id).slice(0, 4),
    [products, product]
  );

  if (!ready) return <SiteChrome><div className="wrap section center muted">Loading…</div></SiteChrome>;

  if (!product) {
    return (
      <SiteChrome>
        <div className="wrap section center">
          <h2>We could not find that bake</h2>
          <Link className="btn btn-ghost" style={{ marginTop: 16 }} href="/menu">Back to menu</Link>
        </div>
      </SiteChrome>
    );
  }

  const qty = cart[product.id] || 0;
  const off = priceOff(product);
  const soldOut = product.track_stock && product.stock <= 0;
  const waText = `Hi! I'd like to ask about the ${product.name} (₹${product.price}).`;

  return (
    <SiteChrome>
      <section className="wrap" style={{ paddingTop: 22 }}>
        <button className="link row" onClick={() => router.push('/menu')} style={{ background: 'none', border: 'none' }}>
          <Icon name="back" size={16} /> Back to menu
        </button>

        <div
          className="grid grid-2 product-detail-grid"
          style={{ gap: 34, marginTop: 18, alignItems: 'start' }}
        >
          <div
            className="card product-detail-image"
            style={{ overflow: 'hidden', padding: 12 }}
          >
            <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden' }}>
              <img src={product.image} alt={product.name} style={{ width: '100%', aspectRatio: '1/0.95', objectFit: 'cover' }} />
              <span className="product-flags">
                {off > 0 && <span className="tag tag-off">{off}% OFF</span>}
                {!!product.bestseller && <span className="tag tag-best">Bestseller</span>}
              </span>
            </div>
          </div>

          <div className="product-detail-info">
          <div className="row wrap-gap product-tags" style={{ gap: 8 }}>
              {!!product.veg && <span className="tag tag-veg">● Veg</span>}
              {!!product.eggless && <span className="tag tag-eggless">Eggless option</span>}
              <span className="tag tag-plain" style={{ textTransform: 'capitalize' }}>{product.category}</span>
            </div>

            <h1
            className="product-detail-name"
            style={{ margin: '12px 0 8px' }}
          >
            {product.name}
          </h1>

            <div className="row small product-detail-rating" style={{ gap: 8 }}>
              <Stars value={product.rating} size={15} />
              <b>{product.rating}</b>
              <span className="muted">· {product.rating_count} Google reviews</span>
            </div>

            <div
              className="row product-detail-price"
              style={{ gap: 10, margin: '16px 0' }}
            >
              <span className="price" style={{ fontSize: '2.2rem' }}>₹{product.price}</span>
              {off > 0 && <span className="strike">₹{product.mrp}</span>}
              <span className="muted">/ {product.unit}</span>
            </div>

            <p className="muted product-detail-description">
              {product.description}
            </p>

            <div
              className="grid grid-2 product-detail-delivery"
              style={{ gap: 12, margin: '20px 0' }}
            >
              <div className="card pad row" style={{ gap: 12, padding: 14 }}>
                <Icon name="bag" size={20} />
                <span><b className="small">Pickup ready</b><div className="tiny muted">{delivery.prep_time || 'in ~2 hours'}</div></span>
              </div>
              <div className="card pad row" style={{ gap: 12, padding: 14 }}>
                <Icon name="bike" size={20} />
                <span>
                  <b className="small">Home delivery</b>
                  <div className="tiny muted">
                    {delivery.enabled_today === false ? 'Paused for today' : `Within ${delivery.radius_km} km · from ₹${delivery.base_charge}`}
                  </div>
                </span>
              </div>
            </div>

            {soldOut ? (
              <div className="alert alert-error">Sold out for today — we bake a fresh batch every morning.</div>
            ) : (
              <div
                className="row wrap-gap product-detail-actions"
                style={{ gap: 14 }}
              >
                <span className="qty" style={{ padding: 6 }}>
                  <button onClick={() => setQty(product.id, Math.max(0, qty - 1))}>−</button>
                  <span>{qty || 1}</span>
                  <button onClick={() => addToCart(product, 1)}>+</button>
                </span>
                {qty > 0 && <span className="tag tag-veg">✓ {qty} in basket</span>}
                <button
                  className="btn"
                  onClick={() => { if (qty === 0) addToCart(product, 1); router.push('/checkout'); }}
                >
                  Order now
                </button>
              </div>
            )}

            {product.track_stock && product.stock > 0 && product.stock <= product.low_stock_at && (
              <p
                className="small product-detail-stock"
                style={{ color: '#b07d0a', marginTop: 10 }}
              >Hurry — only {product.stock} left today.</p>
            )}

            {!!product.customizable && (
              <p
                className="small product-detail-customize"
                style={{ marginTop: 14 }}
              >
                Want a message, a theme or a different weight?{' '}
                <Link className="link" href={`/custom-cake?base=${product.slug}`}>Customise this cake</Link>
              </p>
            )}

            <div
              className="row wrap-gap product-detail-whatsapp"
              style={{ marginTop: 20, gap: 12 }}
            >
              <a className="btn btn-ghost btn-sm" href={`https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noreferrer">
                <WhatsAppIcon size={16} /> Ask on WhatsApp
              </a>
              <span className="chip"><Icon name="clock" size={14} /> Baked today</span>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="section">
            <h2 style={{ marginBottom: 18 }}>You may also like</h2>
            <div className="grid grid-4" style={{ paddingBottom: 30 }}>
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </section>
    </SiteChrome>
  );
}
