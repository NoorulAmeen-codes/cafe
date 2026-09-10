'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import SiteChrome from '@/components/SiteChrome';
import ProductCard from '@/components/ProductCard';
import MapView from '@/components/MapView';
import { useStore } from '@/components/Providers';
import { Icon, Stars, GoogleG } from '@/components/Icon';

export default function HomePage() {
  const store = useStore();
  const { carousels, categories, products, reviews, shop, delivery, layout, ready } = store;
  const [slide, setSlide] = useState(0);
  const [tab, setTab] = useState('all');
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  useEffect(() => {
    if (carousels.length < 2) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % carousels.length), 5200);
    return () => clearInterval(t);
  }, [carousels.length]);
  const handleTouchStart = (e) => {
  setTouchStart(e.targetTouches[0].clientX);
  setTouchEnd(null);
};

const handleTouchMove = (e) => {
  setTouchEnd(e.targetTouches[0].clientX);
};

const handleTouchEnd = () => {
  if (touchStart === null || touchEnd === null || carousels.length < 2) return;

  const distance = touchStart - touchEnd;
  const minSwipeDistance = 50;

  if (Math.abs(distance) >= minSwipeDistance) {
    if (distance > 0) {
      // Swipe left → next slide
      setSlide((s) => (s + 1) % carousels.length);
    } else {
      // Swipe right → previous slide
      setSlide((s) => (s - 1 + carousels.length) % carousels.length);
    }
  }

  setTouchStart(null);
  setTouchEnd(null);
};

  const shown = useMemo(
    () => (tab === 'all' ? products : products.filter((p) => p.category === tab)).slice(0, 12),
    [products, tab]
  );

  const counts = useMemo(() => {
    const c = { all: products.length };
    for (const p of products) c[p.category] = (c[p.category] || 0) + 1;
    return c;
  }, [products]);

  const sections = layout.sections?.length
    ? layout.sections.filter((s) => s.visible !== false)
    : [{ id: 'hero' }, { id: 'categories' }, { id: 'products' }, { id: 'custom' }, { id: 'reviews' }, { id: 'bestsellers' }, { id: 'map' }, { id: 'usp' }];

  const current = carousels[slide] || null;

  const blocks = {
    hero: current && (
      <section className="wrap" style={{ paddingTop: 26 }} key="hero">
        <div
        className="hero"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
          <div>
            <div className="eyebrow">♥ {current.eyebrow} ♥</div>
            <h1>
              {current.title}
              <br />
              <span style={{ color: 'var(--accent)' }}>{current.title_accent}</span>
            </h1>
            <p className="muted" style={{ margin: '16px 0 26px', maxWidth: 420, fontSize: '1.02rem' }}>
              {current.subtitle}
            </p>
            <Link className="btn" href={current.cta_href || '/menu'}>
              {current.cta_label} <Icon name="arrow" size={17} />
            </Link>
            {delivery.enabled_today === false && (
              <div className="alert alert-warn" style={{ marginTop: 18, maxWidth: 420 }}>
                {delivery.off_reason || 'Home delivery is off today — pickup is open.'}
              </div>
            )}
          </div>
          <Link
            href={current.cta_href || '/menu'}
            className="hero-media"
            aria-label={current.cta_label || current.title}
          >
            <span className="slide-count">
              SLIDE {slide + 1}/{carousels.length}
            </span>

            <img src={current.image} alt={current.title} />
          </Link>
        </div>

        <div className="dots">
          <button className="arrow" onClick={() => setSlide((s) => (s - 1 + carousels.length) % carousels.length)} aria-label="Previous">‹</button>
          {carousels.map((c, i) => (
            <button key={c.id} className={'dot' + (i === slide ? ' active' : '')} onClick={() => setSlide(i)} aria-label={`Slide ${i + 1}`} />
          ))}
          <button className="arrow" onClick={() => setSlide((s) => (s + 1) % carousels.length)} aria-label="Next">›</button>
        </div>
      </section>
    ),

    categories: (
      <section className="wrap section" key="categories">
        <div className="section-head">
          <h2>Shop by Category</h2>
          <Link className="link" href="/menu">View All</Link>
        </div>
        <div className="grid category-grid">
          {categories.map((c) => (
            <Link key={c.id} href={`/menu?cat=${c.slug}`} className="card pad center" style={{ display: 'grid', gap: 8, justifyItems: 'center' }}>
              <Icon name={c.icon} size={26} />
              <b>{c.name}</b>
            </Link>
          ))}
        </div>
      </section>
    ),

    products: (
      <section className="wrap section" key="products">
        <div className="section-head">
          <div>
            <div className="eyebrow">Everything we bake</div>
            <h2>Fresh From The Oven</h2>
          </div>
          <Link className="link" href="/menu">View All</Link>
        </div>

        <div className="row wrap-gap product-filters" style={{ marginBottom: 18 }}>
          <button className={'chip' + (tab === 'all' ? ' active' : '')} onClick={() => setTab('all')}>
            All <span className="count">{counts.all || 0}</span>
          </button>
          {categories.map((c) => (
            <button key={c.id} className={'chip' + (tab === c.slug ? ' active' : '')} onClick={() => setTab(c.slug)}>
              {c.name} <span className="count">{counts[c.slug] || 0}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-4 product-grid">
          {shown.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
        {!ready && <p className="muted center" style={{ padding: 30 }}>Loading the counter…</p>}
      </section>
    ),

    custom: (
      <section className="wrap section" key="custom">
        <div className="card" style={{ background: 'color-mix(in srgb, var(--accent) 22%, #fffdf6)', padding: 28, position: 'relative' }}>
          <span className="tag" style={{ position: 'absolute', top: 18, right: 22, background: '#fff' }}>MADE TO ORDER</span>
          <div className="grid grid-2" style={{ alignItems: 'center', gap: 30 }}>
            <div style={{ borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
              <img src="/img/hero-3.jpg" alt="Custom cake" style={{ aspectRatio: '4/3', objectFit: 'cover' }} />
            </div>
            <div>
              <div className="eyebrow">Make every occasion special</div>
              <h2>Custom Cake<br />For Every Occasion</h2>
              <div className="row wrap-gap" style={{ margin: '18px 0' }}>
                {['Birthday', 'Anniversary', 'Wedding', 'Other Events'].map((o) => (
                  <span key={o} className="chip">{o}</span>
                ))}
              </div>
              <Link className="btn" href="/custom-cake">Design Your Cake <Icon name="arrow" size={17} /></Link>
            </div>
          </div>
        </div>
      </section>
    ),

    reviews: (
      <section className="wrap section" key="reviews">
        <div className="section-head">
          <div>
            <div className="eyebrow">Straight from Google</div>
            <h2>What Our Regulars Say</h2>
          </div>
          <a className="link" href={shop.google_listing_url} target="_blank" rel="noreferrer">All Google reviews ↗</a>
        </div>

        <div className="card pad row-between wrap-gap" style={{ marginBottom: 16 }}>
          <div className="row" style={{ gap: 16 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.4rem', fontWeight: 900, lineHeight: 1 }}>
                {shop.google_rating}
              </div>
              <div className="tiny muted">{shop.google_review_count}+ Google reviews</div>
            </div>
            <div style={{ borderLeft: '1px solid var(--line)', paddingLeft: 16 }} className="row">
              <GoogleG size={20} />
              <span className="small muted">Verified Google reviews — the best ones, unedited.</span>
            </div>
          </div>
          <a className="btn btn-ghost btn-sm" href={shop.google_review_url} target="_blank" rel="noreferrer">
            <GoogleG /> Write yours on Google
          </a>
        </div>

        <div className="grid grid-4">
          {reviews.slice(0, 4).map((r) => (
            <div key={r.id} className="card pad">
              <div className="row-between">
                <div className="row">
                  <span style={{
                    width: 38, height: 38, borderRadius: '50%', display: 'grid', placeItems: 'center',
                    background: 'color-mix(in srgb, var(--primary) 12%, #fff)', fontWeight: 900, fontSize: '.8rem',
                  }}>
                    {r.author.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <b className="small">{r.author}</b>
                    <div className="tiny muted row" style={{ gap: 4 }}>
                      <GoogleG size={11} /> {r.source === 'google' ? 'Posted on Google' : 'Verified order'} · {r.posted_on}
                    </div>
                  </div>
                </div>
                <Stars value={r.rating} size={11} />
              </div>
              <p className="small" style={{ marginTop: 12 }}>“{r.text}”</p>
            </div>
          ))}
        </div>
      </section>
    ),

    bestsellers: (
      <section className="wrap section" key="bestsellers">
        <div className="eyebrow">Popular right now</div>
        <div className="row wrap-gap" style={{ marginTop: 12 }}>
          {products.filter((p) => p.bestseller).map((p) => (
            <Link key={p.id} href={`/product/${p.slug}`} className="card pad row" style={{ gap: 8, padding: '12px 18px' }}>
              <Icon name="cake" size={16} style={{ color: 'var(--accent)' }} />
              <b className="small">{p.name}</b>
            </Link>
          ))}
          <Link href="/custom-cake" className="card pad row" style={{ gap: 8, padding: '12px 18px' }}>
            <Icon name="sparkle" size={16} style={{ color: 'var(--accent)' }} />
            <b className="small">Custom Cake</b>
          </Link>
        </div>
      </section>
    ),

    map: (
      <section className="wrap section" key="map">
        <div className="eyebrow">Come say hi</div>
        <h2 style={{ marginBottom: 18 }}>Find Us</h2>
        <div className="card" style={{ overflow: 'hidden' }}>
          <MapView lat={Number(shop.lat) || 10.6721} lng={Number(shop.lng) || 76.6467} zoom={shop.map_zoom || 15} radiusKm={delivery.radius_km} height={360} />
          <div className="pad grid grid-2" style={{ gap: 20 }}>
            <div>
              <h3>{shop.name}</h3>
              <p className="muted small" style={{ marginTop: 6 }}>{shop.address}</p>
              <a className="link row" style={{ marginTop: 12 }} href={`https://www.google.com/maps?q=${shop.lat},${shop.lng}`} target="_blank" rel="noreferrer">
                Get Directions <Icon name="arrow" size={15} />
              </a>
            </div>
            <div className="stack small" style={{ gap: 10 }}>
              <span className="row"><Icon name="clock" size={16} /> {shop.hours}</span>
              <a className="row" href={`tel:${(shop.phone || '').replace(/\s/g, '')}`}><Icon name="phone" size={16} /> <b>{shop.phone}</b></a>
              <a className="row" href={`mailto:${shop.email}`}><Icon name="mail" size={16} /> {shop.email}</a>
              <span className="row muted"><Icon name="pin" size={16} /> {shop.landmark}</span>
              <span className="row muted"><Icon name="bike" size={16} /> Home delivery within {delivery.radius_km} km</span>
            </div>
          </div>
        </div>
      </section>
    ),

    usp: (
      <section className="wrap section" key="usp">
        <div className="grid grid-4">
          {[
            { icon: 'leaf', t: 'Fresh Ingredients', s: 'Always fresh' },
            { icon: 'egg', t: '100% Eggless Options', s: 'On every cake' },
            { icon: 'heart', t: 'Custom Made', s: 'With love' },
            { icon: 'bike', t: 'On-Time Delivery', s: 'Every time' },
          ].map((u) => (
            <div key={u.t} className="card pad row" style={{ gap: 14 }}>
              <span style={{
                width: 44, height: 44, borderRadius: 14, display: 'grid', placeItems: 'center',
                background: 'color-mix(in srgb, var(--accent) 22%, #fff)',
              }}><Icon name={u.icon} size={20} /></span>
              <span>
                <b>{u.t}</b>
                <div className="tiny muted">{u.s}</div>
              </span>
            </div>
          ))}
        </div>
      </section>
    ),
  };

  return <SiteChrome>{sections.map((s) => blocks[s.id] || null)}</SiteChrome>;
}
