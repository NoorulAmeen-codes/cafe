'use client';

import { useEffect, useState } from 'react';
import AdminShell, { useAdmin, ImageInput } from '@/components/AdminShell';
import { apiFetch } from '@/components/Providers';
import { Icon } from '@/components/Icon';

export default function AdminCarousel() {
  return (
    <AdminShell title="Homepage carousel" subtitle="Edit the sliding banners — image, headline and button">
      <Body />
    </AdminShell>
  );
}

function Body() {
  const { toast } = useAdmin();
  const [slides, setSlides] = useState([]);

  const load = () => apiFetch('/api/admin/carousels').then((r) => setSlides(r.slides)).catch((e) => toast(e.message, 'err'));
  useEffect(() => { load(); }, []);

  const patch = (id, key, value) =>
    setSlides((s) => s.map((x) => (x.id === id ? { ...x, [key]: value } : x)));

  const save = async (slide) => {
    try { await apiFetch('/api/admin/carousels', { method: 'PUT', body: slide }); toast('Slide saved'); load(); }
    catch (e) { toast(e.message, 'err'); }
  };

  const add = async () => {
    try {
      await apiFetch('/api/admin/carousels', {
        method: 'POST',
        body: { eyebrow: 'NEW', title: 'Fresh headline,', title_accent: 'Second line', subtitle: 'Say something tasty here.', image: '/img/hero-2.jpg' },
      });
      toast('Slide added'); load();
    } catch (e) { toast(e.message, 'err'); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this slide?')) return;
    try { await apiFetch(`/api/admin/carousels?id=${id}`, { method: 'DELETE' }); toast('Slide deleted'); load(); }
    catch (e) { toast(e.message, 'err'); }
  };

  const move = async (slide, dir) => {
    const sorted = [...slides].sort((a, b) => a.sort - b.sort);
    const i = sorted.findIndex((s) => s.id === slide.id);
    const j = i + dir;
    if (j < 0 || j >= sorted.length) return;
    await apiFetch('/api/admin/carousels', { method: 'PUT', body: { ...sorted[i], sort: sorted[j].sort } });
    await apiFetch('/api/admin/carousels', { method: 'PUT', body: { ...sorted[j], sort: sorted[i].sort } });
    load();
  };

  return (
    <>
      <div className="row-between" style={{ marginBottom: 16 }}>
        <p className="muted small">{slides.length} slides · shown in this order on the homepage</p>
        <button className="btn btn-sm" onClick={add}><Icon name="plus" size={15} /> Add slide</button>
      </div>

      <div className="stack">
        {slides.map((s, i) => (
          <div key={s.id} className="card pad">
            <div className="row-between" style={{ marginBottom: 12 }}>
              <b>Slide {i + 1}</b>
              <div className="row" style={{ gap: 6 }}>
                <button className="chip" onClick={() => move(s, -1)}>↑</button>
                <button className="chip" onClick={() => move(s, 1)}>↓</button>
                <label className="switch" style={{ marginLeft: 8 }}>
                  <input type="checkbox" checked={!!s.active} onChange={(e) => { patch(s.id, 'active', e.target.checked ? 1 : 0); save({ ...s, active: e.target.checked ? 1 : 0 }); }} />
                  <span className="track" /><span className="tiny">Live</span>
                </label>
                <button className="chip" style={{ color: 'var(--danger)' }} onClick={() => remove(s.id)}><Icon name="trash" size={14} /></button>
              </div>
            </div>

            <div className="grid grid-2" style={{ gap: 18, alignItems: 'start' }}>
              <div className="stack">
                <div className="form-grid">
                  <label className="field">Eyebrow<input className="input" value={s.eyebrow || ''} onChange={(e) => patch(s.id, 'eyebrow', e.target.value)} /></label>
                  <label className="field">Button label<input className="input" value={s.cta_label || ''} onChange={(e) => patch(s.id, 'cta_label', e.target.value)} /></label>
                </div>
                <div className="form-grid">
                  <label className="field">Headline line 1<input className="input" value={s.title || ''} onChange={(e) => patch(s.id, 'title', e.target.value)} /></label>
                  <label className="field">Headline line 2 (accent)<input className="input" value={s.title_accent || ''} onChange={(e) => patch(s.id, 'title_accent', e.target.value)} /></label>
                </div>
                <label className="field">Subtitle<textarea className="input" value={s.subtitle || ''} onChange={(e) => patch(s.id, 'subtitle', e.target.value)} /></label>
                <label className="field">Button link<input className="input" value={s.cta_href || ''} onChange={(e) => patch(s.id, 'cta_href', e.target.value)} placeholder="/menu" /></label>
                <ImageInput value={s.image} onChange={(v) => patch(s.id, 'image', v)} label="Slide image" />
                <button className="btn btn-sm" style={{ width: 'fit-content' }} onClick={() => save(s)}>Save slide</button>
              </div>

              <div className="hero" style={{ padding: 22, gridTemplateColumns: '1fr', gap: 14 }}>
                <div>
                  <div className="eyebrow">♥ {s.eyebrow} ♥</div>
                  <h2 style={{ fontSize: '1.5rem' }}>{s.title}<br /><span style={{ color: 'var(--accent)' }}>{s.title_accent}</span></h2>
                  <p className="tiny muted" style={{ marginTop: 8 }}>{s.subtitle}</p>
                  <span className="btn btn-sm" style={{ marginTop: 12 }}>{s.cta_label}</span>
                </div>
                <div className="hero-media" style={{ aspectRatio: '16/9' }}><img src={s.image} alt="" /></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
