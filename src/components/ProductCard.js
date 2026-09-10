'use client';

import Link from 'next/link';
import { useStore } from './Providers';
import { Icon, Stars } from './Icon';

export function priceOff(product) {
  if (!product.mrp || product.mrp <= product.price) return 0;
  return Math.round(((product.mrp - product.price) / product.mrp) * 100);
}

export default function ProductCard({ product }) {
  const { cart, addToCart, setQty, toast } = useStore();
  const qty = cart[product.id] || 0;
  const off = priceOff(product);
  const soldOut = product.track_stock && product.stock <= 0;
  const low = product.track_stock && product.stock > 0 && product.stock <= product.low_stock_at;

  const add = () => {
    if (soldOut) return;
    if (product.track_stock && qty >= product.stock) {
      toast(`Only ${product.stock} left in stock`, 'err');
      return;
    }
    addToCart(product, 1);
    toast(`${product.name} added to basket`);
  };

  return (
    <article className="product">
      <Link href={`/product/${product.slug}`} className="product-media">
        <img src={product.image || '/img/hero-2.jpg'} alt={product.name} loading="lazy" />
        <span className="product-flags">
          {off > 0 && <span className="tag tag-off">{off}% OFF</span>}
          {!!product.bestseller && <span className="tag tag-best">Bestseller</span>}
        </span>
        {soldOut && (
          <span style={{
            position: 'absolute', inset: 0, background: 'rgba(255,255,255,.72)',
            display: 'grid', placeItems: 'center', fontWeight: 900, color: 'var(--danger)',
          }}>
            Sold out for today
          </span>
        )}
      </Link>

      <div className="product-body">
        <div className="row" style={{ gap: 6 }}>
          {!!product.veg && <span className="tag tag-veg">● Veg</span>}
          {!!product.eggless && <span className="tag tag-eggless">Eggless</span>}
          {low && <span className="stock-pill stock-low">Only {product.stock} left</span>}
        </div>

        <Link href={`/product/${product.slug}`}>
          <div className="product-name">{product.name}</div>
        </Link>
        <div className="tiny muted">{product.unit}</div>

        <div className="row tiny" style={{ gap: 6 }}>
          <Stars value={product.rating} />
          <b>{product.rating}</b>
          <span className="muted">({product.rating_count})</span>
        </div>

        <div className="row-between" style={{ marginTop: 'auto', paddingTop: 8 }}>
          <div className="row" style={{ gap: 6 }}>
            <span className="price">₹{product.price}</span>
            {off > 0 && <span className="strike small">₹{product.mrp}</span>}
          </div>

          {soldOut ? (
            <span className="stock-pill stock-out">Sold out</span>
          ) : qty > 0 ? (
            <span className="qty">
              <button onClick={() => setQty(product.id, qty - 1)} aria-label="Reduce">−</button>
              <span>{qty}</span>
              <button onClick={add} aria-label="Add">+</button>
            </span>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={add}>
              <Icon name="basket" size={15} /> Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
