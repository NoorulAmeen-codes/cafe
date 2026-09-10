'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from './Icon';
import { apiFetch } from './Providers';

const AdminCtx = createContext({ toast: () => {} });
export const useAdmin = () => useContext(AdminCtx);

// Keep admin authentication state while navigating between admin pages
let adminSessionCache = null;

const LINKS = [
  { href: '/admin', label: 'Dashboard', icon: 'dash' },
  { href: '/admin/orders', label: 'Orders', icon: 'bag' },
  { href: '/admin/products', label: 'Products & stock', icon: 'box' },
  { href: '/admin/customers', label: 'Customers', icon: 'users' },
  { href: '/admin/carousel', label: 'Carousel', icon: 'slides' },
  { href: '/admin/delivery', label: 'Delivery & location', icon: 'truck' },
  { href: '/admin/reviews', label: 'Reviews', icon: 'star' },
  { href: '/admin/appearance', label: 'Colours & layout', icon: 'palette' },
  { href: '/admin/logs', label: 'Bugs & errors', icon: 'bug' },
  { href: '/admin/settings', label: 'Shop settings', icon: 'gear' },
];

export function ImageInput({ value, onChange, label = 'Image' }) {
  const [busy, setBusy] = useState(false);
  const upload = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (file.size > 4 * 1024 * 1024) {
    alert('Image must be 4 MB or smaller.');
    e.target.value = '';
    return;
  }

  setBusy(true);
  const reader = new FileReader();

  reader.onload = async () => {
    try {
      const res = await apiFetch('/api/upload', {
        method: 'POST',
        body: { data: reader.result },
      });
      onChange(res.url);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  reader.readAsDataURL(file);
};
  return (
    <div className="field">
      <span>{label}</span>
      <div className="row wrap-gap" style={{ gap: 12 }}>
        {value && <img src={value} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', border: '1px solid var(--line)' }} />}
        <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
          {busy ? 'Uploading…' : value ? 'Replace' : 'Upload'}
          <input type="file" accept="image/*" hidden onChange={upload} />
        </label>
        <input className="input grow" style={{ minWidth: 160 }} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="/img/cake.jpg" />
      </div>
    </div>
  );
}

export default function AdminShell({ title, subtitle, actions, children }) {
  const [state, setState] = useState(() => {
  if (adminSessionCache === true) return 'in';
  if (adminSessionCache === false) return 'out';
  return 'checking';
});
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState([]);
  const path = usePathname();
  const router = useRouter();

  const toast = (message, kind = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  };

  useEffect(() => {
  // Already authenticated in this browser session
  if (adminSessionCache === true) {
    setState('in');
    return;
  }

  // Already known to be logged out
  if (adminSessionCache === false) {
    setState('out');
    return;
  }

  // Check the actual server session only when needed
  apiFetch('/api/admin/session')
    .then((d) => {
      if (d.admin) {
        adminSessionCache = true;
        sessionStorage.setItem('admin_authenticated', 'true');
        setState('in');
      } else {
        adminSessionCache = false;
        sessionStorage.removeItem('admin_authenticated');
        setState('out');
      }
    })
    .catch(() => {
      adminSessionCache = false;
      sessionStorage.removeItem('admin_authenticated');
      setState('out');
    });
}, []);

  const login = async (e) => {
  e.preventDefault();
  setError('');

  try {
    await apiFetch('/api/admin/session', {
        method: 'POST',
        body: creds,
      });

      adminSessionCache = true;
      sessionStorage.setItem('admin_authenticated', 'true');
      setState('in');
  } catch (err) {
    setError(err.message);
  }
};

  if (state === 'checking') {
    return <div className="wrap section center muted">Checking your session…</div>;
  }

  if (state === 'out') {
    return (
      <div className="wrap section" style={{ maxWidth: 420 }}>
        <div className="card pad">
          <div className="eyebrow">Staff area</div>
          <h1 style={{ fontSize: '1.8rem' }}>Admin login</h1>
          <p className="muted small" style={{ marginTop: 6 }}>Only bakery staff should sign in here.</p>
          <form onSubmit={login} className="stack" style={{ marginTop: 18 }}>
            {error && <div className="alert alert-error">{error}</div>}
            <label className="field">Username
              <input className="input" value={creds.username} onChange={(e) => setCreds({ ...creds, username: e.target.value })} autoFocus />
            </label>
            <label className="field">Password
              <input className="input" type="password" value={creds.password} onChange={(e) => setCreds({ ...creds, password: e.target.value })} />
            </label>
            <button className="btn btn-block">Sign in</button>
          </form>
          <p className="tiny muted center" style={{ marginTop: 14 }}>
            Admin credentials are securely configured and should not be displayed here.
          </p>
          <p className="tiny center" style={{ marginTop: 10 }}><Link className="link" href="/">← Back to the shop</Link></p>
        </div>
      </div>
    );
  }

  return (
    <AdminCtx.Provider value={{ toast, state }}>
      <div className="admin-shell">
        <aside className="admin-side">
          <div className="side-title" style={{ padding: '6px 14px 18px' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.1rem' }}>Aadhis Admin</div>
            <div className="tiny" style={{ color: 'rgba(246,236,221,.5)' }}>Bakery control panel</div>
          </div>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={path === l.href ? 'active' : ''}>
              <Icon name={l.icon} size={17} /> {l.label}
            </Link>
          ))}
          <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,.12)', paddingTop: 12 }}>
            <Link href="/">
              <Icon name="arrow" size={17} /> View the shop
            </Link>
            <a
              href="#"
              onClick={async (e) => {
                e.preventDefault(); 

                try {
                  await apiFetch('/api/admin/session', { method: 'DELETE' });
                } finally {
                  adminSessionCache = false;
                  sessionStorage.removeItem('admin_authenticated');
                  setState('out');
                  router.push('/admin');
                }
              }}
            >
              <Icon name="logout" size={17} /> Sign out
            </a>
          </div>
        </aside>

        <main className="admin-main">
          <div className="row-between wrap-gap" style={{ marginBottom: 22 }}>
            <div>
              <h1 style={{ fontSize: '1.9rem' }}>{title}</h1>
              {subtitle && <p className="muted small" style={{ marginTop: 4 }}>{subtitle}</p>}
            </div>
            <div className="row wrap-gap">{actions}</div>
          </div>
          {children}
        </main>

        <div className="toast-host">
          {toasts.map((t) => <div key={t.id} className={'toast' + (t.kind === 'err' ? ' err' : '')}>{t.message}</div>)}
        </div>
      </div>
    </AdminCtx.Provider>
  );
}
