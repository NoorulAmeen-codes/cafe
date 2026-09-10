'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import SiteChrome from '@/components/SiteChrome';
import { useStore, apiFetch } from '@/components/Providers';
import { Icon } from '@/components/Icon';

function LoginInner() {
  const { setUser, refresh, toast } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/account';
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const res = await apiFetch('/api/auth/login', { method: 'POST', body: form });
      setUser(res.user);
      await refresh();
      toast(`Welcome back, ${res.user.name.split(' ')[0]}!`);
      router.push(next);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SiteChrome>
      <section className="wrap section" style={{ maxWidth: 460 }}>
        <div className="card pad">
          <div className="eyebrow">Welcome back</div>
          <h1 style={{ fontSize: '2rem' }}>Sign in</h1>
          <p className="muted small" style={{ marginTop: 6 }}>Track your orders, reorder favourites and check delivery in your area.</p>

          <form onSubmit={submit} className="stack" style={{ marginTop: 20 }}>
            {error && <div className="alert alert-error">{error}</div>}
            <label className="field">
              Phone or email
              <input className="input" value={form.identifier} required
                onChange={(e) => setForm({ ...form, identifier: e.target.value })} placeholder="9747614864" />
            </label>
            <label className="field">
              Password
              <input className="input" type="password" value={form.password} required
                onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••" />
            </label>
            <button className="btn btn-block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          </form>

          <p className="small center muted" style={{ marginTop: 18 }}>
            New here? <Link className="link" href={`/register?next=${encodeURIComponent(next)}`}>Create an account</Link>
          </p>
          <p className="tiny center muted" style={{ marginTop: 10 }}>
            <Link href="/admin" className="row" style={{ justifyContent: 'center' }}><Icon name="gear" size={13} /> Staff / admin login</Link>
          </p>
        </div>
      </section>
    </SiteChrome>
  );
}

export default function LoginPage() {
  return <Suspense fallback={null}><LoginInner /></Suspense>;
}
