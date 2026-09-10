'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import SiteChrome from '@/components/SiteChrome';
import ProductCard from '@/components/ProductCard';
import { useStore } from '@/components/Providers';
import { Icon } from '@/components/Icon';

function MenuInner() {
  const { products, categories, delivery, ready } = useStore();
  const params = useSearchParams();
  const [cat, setCat] = useState(params.get('cat') || 'all');
  const [q, setQ] = useState('');
  const [egglessOnly, setEgglessOnly] = useState(false);
  const [sort, setSort] = useState('popular');

  const list = useMemo(() => {
    let out = products.filter((p) => (cat === 'all' ? true : p.category === cat));
    if (egglessOnly) out = out.filter((p) => p.eggless);
    if (q.trim()) {
      const needle = q.toLowerCase();
      out = out.filter((p) => (p.name + ' ' + p.description + ' ' + p.category).toLowerCase().includes(needle));
    }
    const sorters = {
      popular: (a, b) => b.bestseller - a.bestseller || b.rating - a.rating,
      price_low: (a, b) => a.price - b.price,
      price_high: (a, b) => b.price - a.price,
      rating: (a, b) => b.rating - a.rating,
      name: (a, b) => a.name.localeCompare(b.name),
    };
    return [...out].sort(sorters[sort] || sorters.popular);
  }, [products, cat, q, egglessOnly, sort]);

  const label = cat === 'all' ? 'everything' : categories.find((c) => c.slug === cat)?.name || cat;

  return (
    <SiteChrome>
      <section className="wrap" style={{ paddingTop: 28 }}>
        <div className="eyebrow">Our menu</div>
        <h1>Freshly Baked Menu</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          {products.length} bakes · {delivery.prep_time || 'pickup in ~2 hrs'} or home delivery within {delivery.radius_km} km
        </p>

        <div className="card pad" style={{ marginTop: 22 }}>
          <div className="row wrap-gap menu-search-row" style={{ gap: 12 }}>
            <div
              className="row grow menu-search-box"
              style={{
                border: '1px solid var(--line)',
                borderRadius: 999,
                padding: '4px 16px',
                background: 'var(--bg)',
              }}
            >
              <Icon name="search" size={18} />
              <input
                className="input" style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}
                placeholder="Search cakes, breads, coffee…" value={q} onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <select
              className="input menu-sort"
              style={{ width: 180 }}
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="popular">Popular</option>
              <option value="price_low">Price: low to high</option>
              <option value="price_high">Price: high to low</option>
              <option value="rating">Top rated</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>

          <div className="row wrap-gap" style={{ marginTop: 14 }}>
            <button className={'chip' + (cat === 'all' ? ' active' : '')} onClick={() => setCat('all')}>All</button>
            {categories.map((c) => (
              <button key={c.id} className={'chip' + (cat === c.slug ? ' active' : '')} onClick={() => setCat(c.slug)}>{c.name}</button>
            ))}
            <button className={'chip' + (egglessOnly ? ' active' : '')} onClick={() => setEgglessOnly((v) => !v)}>
              <Icon name="egg" size={14} /> Eggless only
            </button>
          </div>
        </div>

        <p className="eyebrow" style={{ margin: '22px 0 12px' }}>
          {list.length} items in {label}
        </p>

        <div className="grid grid-4" style={{ paddingBottom: 40 }}>
          {list.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>

        {ready && list.length === 0 && (
          <div className="card pad center" style={{ padding: 50, marginBottom: 40 }}>
            <div style={{ fontSize: 36 }}>🍰</div>
            <h3 style={{ marginTop: 10 }}>Nothing matches that search</h3>
            <p className="muted small">Try another flavour, or clear the filters.</p>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 14 }} onClick={() => { setQ(''); setCat('all'); setEgglessOnly(false); }}>
              Clear filters
            </button>
          </div>
        )}
      </section>
    </SiteChrome>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={null}>
      <MenuInner />
    </Suspense>
  );
}
