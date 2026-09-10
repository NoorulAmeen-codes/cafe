'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from './Providers';
import { Icon, WhatsAppIcon } from './Icon';
import ReviewPrompt from './ReviewPrompt';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Menu' },
  { href: '/custom-cake', label: 'Custom Cake' },
  { href: '/account', label: 'Orders' },
];

export function Header() {
  const { cartCount, shop, user } = useStore();
  const path = usePathname();

  const isActive = (href) =>
    href === '/' ? path === '/' : path.startsWith(href);

  return (
    <>
      {/* TOP HEADER */}
      <header className="header">
        <div className="header-inner">

          {/* Desktop navigation */}
          <nav className="nav">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={isActive(n.href) ? 'active' : ''}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          {/* Logo */}
          <Link href="/" className="brand">
            <span className="brand-mark">
              <Icon name="cake" size={22} />
            </span>

            <span>
              <div className="brand-name">
                {shop.name || 'Aadhis Cake Cafe'}
              </div>

              <div className="brand-sub">
                {shop.tagline || 'LIVE CAKE'}
              </div>
            </span>
          </Link>

          {/* Search / Account / Cart */}
          <div className="header-actions">
            <Link
              href="/menu"
              className="icon-btn"
              aria-label="Search"
            >
              <Icon name="search" />
            </Link>

            <Link
              href={user ? '/account' : '/login'}
              className="icon-btn"
              aria-label="Account"
            >
              <Icon name="user" />
            </Link>

            <Link
              href="/checkout"
              className="icon-btn"
              aria-label="Basket"
            >
              <Icon name="basket" />

              {cartCount > 0 && (
                <span className="badge">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION */}
      {path === '/' && (
      <nav
        className="mobile-bottom-nav"
        aria-label="Mobile navigation"
      >
        <Link
          href="/"
          className={isActive('/') ? 'active' : ''}
        >
          <Icon name="home" size={21} />
          <span>Home</span>
        </Link>

        <Link
          href="/menu"
          className={isActive('/menu') ? 'active' : ''}
        >
          <Icon name="cake" size={21} />
          <span>Menu</span>
        </Link>

        <Link
          href="/custom-cake"
          className={isActive('/custom-cake') ? 'active' : ''}
        >
          <Icon name="sparkle" size={21} />
          <span>Custom Cake</span>
        </Link>

        <Link
          href="/account"
          className={isActive('/account') ? 'active' : ''}
        >
          <span className="mobile-orders-icon">
            <Icon name="bag" size={21} />

            {cartCount > 0 && (
              <span className="mobile-nav-badge">
                {cartCount}
              </span>
            )}
          </span>

          <span>Orders</span>
        </Link>
     </nav>
      )}
    </>
  );
}
export function Footer() {
  const { shop } = useStore();
  const wa = `https://wa.me/${shop.whatsapp || ''}`;
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <div className="row" style={{ marginBottom: 12 }}>
              <span className="brand-mark"><Icon name="cake" size={22} /></span>
              <span>
                <div className="brand-name" style={{ fontSize: '1.35rem' }}>{shop.name}</div>
                <div className="brand-sub">{shop.tagline}</div>
              </span>
            </div>
            <p className="muted small" style={{ maxWidth: 340 }}>{shop.blurb}</p>
            <div className="row wrap-gap product-order-bar" style={{ gap: 14 }}>
              <a className="btn btn-ghost btn-sm" href={shop.google_listing_url} target="_blank" rel="noreferrer">
                Rated on Google
              </a>
              <a className="btn btn-sm" style={{ background: '#25d366', color: '#fff' }} href={wa} target="_blank" rel="noreferrer">
                <WhatsAppIcon size={16} /> WhatsApp us
              </a>
            </div>
          </div>

          <div>
            <div className="eyebrow">Visit &amp; contact</div>
            <div className="stack small" style={{ gap: 10, marginTop: 12 }}>
              <span className="row"><Icon name="pin" size={16} /> {shop.address}</span>
              <span className="row"><Icon name="clock" size={16} /> {shop.hours}</span>
              <a className="row" href={`tel:${(shop.phone || '').replace(/\s/g, '')}`}><Icon name="phone" size={16} /> {shop.phone}</a>
              <a className="row" href={`mailto:${shop.email}`}><Icon name="mail" size={16} /> {shop.email}</a>
              <a className="row link" href={`https://www.google.com/maps?q=${shop.lat},${shop.lng}`} target="_blank" rel="noreferrer">
                <Icon name="pin" size={16} /> Get directions
              </a>
            </div>
          </div>

          <div>
            <div className="eyebrow">Quick links</div>
            <div className="stack small" style={{ gap: 10, marginTop: 12 }}>
              {NAV.map((n) => <Link key={n.href} href={n.href}>{n.label}</Link>)}
              <Link href="/custom-cake">Order a custom cake</Link>
              <Link href="/register">Create an account</Link>
              <Link href="/admin">Staff login</Link>
            </div>
          </div>
        </div>

        <div className="row-between small muted" style={{ marginTop: 34, borderTop: '1px solid var(--line)', paddingTop: 18, flexWrap: 'wrap' }}>
          <span>© {new Date().getFullYear()} {shop.name} · Puducode, Thachanady</span>
          <Link href="/admin" className="row"><Icon name="gear" size={14} /> Staff login</Link>
        </div>
      </div>
    </footer>
  );
}

export function WhatsAppFloat({ text = 'Hi! I would like to order from Aadhis Cake Cafe.' }) {
  const { shop } = useStore();
  if (!shop.whatsapp) return null;
  return (
    <a
      className="wa-float"
      href={`https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(text)}`}
      target="_blank" rel="noreferrer"
    >
      <WhatsAppIcon /> <span className="hide-sm">WhatsApp us</span>
    </a>
  );
}

export default function SiteChrome({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <WhatsAppFloat />
      <ReviewPrompt />
    </>
  );
}
