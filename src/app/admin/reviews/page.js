'use client';

import { useEffect, useState } from 'react';
import AdminShell, { useAdmin } from '@/components/AdminShell';
import { apiFetch } from '@/components/Providers';
import { Icon, Stars, GoogleG } from '@/components/Icon';

export default function AdminReviews() {
  return (
    <AdminShell title="Reviews" subtitle="Google reviews shown on the homepage plus ratings customers leave after delivery">
      <Body />
    </AdminShell>
  );
}

function Body() {
  const { toast } = useAdmin();
  const [reviews, setReviews] = useState([]);
  const [shop, setShop] = useState(null);
  const [draft, setDraft] = useState({ author: '', rating: 5, text: '', posted_on: '' });

  const load = () => {
    apiFetch('/api/admin/reviews').then((r) => setReviews(r.reviews)).catch((e) => toast(e.message, 'err'));
    apiFetch('/api/admin/settings').then((r) => setShop(r.settings.shop)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!draft.author || !draft.text) return toast('Author and text are required', 'err');
    try { await apiFetch('/api/admin/reviews', { method: 'POST', body: draft }); toast('Review added'); setDraft({ author: '', rating: 5, text: '', posted_on: '' }); load(); }
    catch (e) { toast(e.message, 'err'); }
  };

  const publish = async (r) => {
    try { await apiFetch('/api/admin/reviews', { method: 'PATCH', body: { id: r.id, published: r.published ? 0 : 1 } }); load(); }
    catch (e) { toast(e.message, 'err'); }
  };

  const remove = async (r) => {
    if (!confirm('Delete this review?')) return;
    try { await apiFetch(`/api/admin/reviews?id=${r.id}`, { method: 'DELETE' }); load(); }
    catch (e) { toast(e.message, 'err'); }
  };

  const saveShop = async (patch) => {
    try { await apiFetch('/api/admin/settings', { method: 'PUT', body: { group: 'shop', value: { ...shop, ...patch } } }); toast('Saved'); load(); }
    catch (e) { toast(e.message, 'err'); }
  };

  return (
    <div className="grid" style={{ gridTemplateColumns: '1.3fr 0.7fr', gap: 18, alignItems: 'start' }}>
      <div className="stack">
        {reviews.map((r) => (
          <div key={r.id} className="card pad">
            <div className="row-between wrap-gap">
              <div className="row" style={{ gap: 10 }}>
                <b>{r.author}</b>
                <Stars value={r.rating} size={12} />
                <span className="tag tag-plain">{r.source === 'google' ? 'Google' : 'From an order'}</span>
                {r.order_code && <span className="tiny muted">{r.order_code}</span>}
              </div>
              <div className="row" style={{ gap: 6 }}>
                <label className="switch">
                  <input type="checkbox" checked={!!r.published} onChange={() => publish(r)} />
                  <span className="track" /><span className="tiny">Show on site</span>
                </label>
                <button className="chip" style={{ color: 'var(--danger)' }} onClick={() => remove(r)}><Icon name="trash" size={14} /></button>
              </div>
            </div>
            <p className="small" style={{ marginTop: 8 }}>“{r.text}”</p>
            <div className="tiny muted" style={{ marginTop: 6 }}>{r.posted_on || new Date(r.created_at + 'Z').toLocaleDateString('en-IN')}</div>
          </div>
        ))}
        {reviews.length === 0 && <div className="card pad center muted">No reviews yet</div>}
      </div>

      <div className="stack">
        {shop && (
          <div className="card pad stack">
            <b>Google listing</b>
            <label className="field">Write-a-review link
              <input className="input" value={shop.google_review_url || ''} onChange={(e) => setShop({ ...shop, google_review_url: e.target.value })} />
            </label>
            <label className="field">Listing / all reviews link
              <input className="input" value={shop.google_listing_url || ''} onChange={(e) => setShop({ ...shop, google_listing_url: e.target.value })} />
            </label>
            <div className="form-grid">
              <label className="field">Rating shown
                <input className="input" type="number" step="0.1" value={shop.google_rating || ''} onChange={(e) => setShop({ ...shop, google_rating: e.target.value })} />
              </label>
              <label className="field">Review count
                <input className="input" type="number" value={shop.google_review_count || ''} onChange={(e) => setShop({ ...shop, google_review_count: e.target.value })} />
              </label>
            </div>
            <button className="btn btn-sm" onClick={() => saveShop(shop)}><GoogleG /> Save Google settings</button>
            <p className="tiny muted">
              Customers who rate 4★ or more after delivery are sent straight to this link to post the same review on Google.
            </p>
          </div>
        )}

        <div className="card pad stack">
          <b>Add a Google review manually</b>
          <label className="field">Author<input className="input" value={draft.author} onChange={(e) => setDraft({ ...draft, author: e.target.value })} /></label>
          <div className="form-grid">
            <label className="field">Rating
              <select className="input" value={draft.rating} onChange={(e) => setDraft({ ...draft, rating: Number(e.target.value) })}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
              </select>
            </label>
            <label className="field">Posted on<input className="input" value={draft.posted_on} onChange={(e) => setDraft({ ...draft, posted_on: e.target.value })} placeholder="1 Sep 2026" /></label>
          </div>
          <label className="field">Review text<textarea className="input" value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} /></label>
          <button className="btn btn-sm" onClick={add}><Icon name="plus" size={14} /> Add review</button>
        </div>
      </div>
    </div>
  );
}
