'use client';

import { useEffect, useState } from 'react';
import AdminShell, { useAdmin } from '@/components/AdminShell';
import { apiFetch } from '@/components/Providers';
import { Icon } from '@/components/Icon';

const PRESETS = [
  { name: 'Warm bakery (default)', theme: { primary: '#7a4a1d', accent: '#f0b429', bg: '#fdf6e8', surface: '#ffffff', text: '#3b2a17', muted: '#8a7860' } },
  { name: 'Rose & cream', theme: { primary: '#8c3b56', accent: '#f08fa8', bg: '#fff4f6', surface: '#ffffff', text: '#3d1f28', muted: '#96707a' } },
  { name: 'Pistachio', theme: { primary: '#3f6b42', accent: '#9ccc65', bg: '#f3f8ec', surface: '#ffffff', text: '#22331f', muted: '#77896f' } },
  { name: 'Midnight chocolate', theme: { primary: '#4a2c17', accent: '#d9a441', bg: '#f5efe6', surface: '#ffffff', text: '#2c1c10', muted: '#7d6b58' } },
  { name: 'Blueberry', theme: { primary: '#3c4a8c', accent: '#7c9cf0', bg: '#f1f4ff', surface: '#ffffff', text: '#1f2440', muted: '#6f7796' } },
];

const FONTS = [
  { label: 'Fraunces (default serif)', value: "'Fraunces', Georgia, serif" },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'System sans', value: "system-ui, -apple-system, 'Segoe UI', sans-serif" },
  { label: 'Nunito', value: "'Nunito', system-ui, sans-serif" },
];

export default function AdminAppearance() {
  return (
    <AdminShell title="Colours & layout" subtitle="Recolour the whole site and rearrange the homepage sections">
      <Body />
    </AdminShell>
  );
}

function Body() {
  const { toast } = useAdmin();
  const [theme, setTheme] = useState(null);
  const [layout, setLayout] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => apiFetch('/api/admin/settings').then((r) => { setTheme(r.settings.theme); setLayout(r.settings.layout); }).catch((e) => toast(e.message, 'err'));
  useEffect(() => { load(); }, []);

  // Live preview: push the colours into the running page as you tweak them.
  useEffect(() => {
    if (!theme) return;
    const root = document.documentElement;
    const map = {
      primary: '--primary', accent: '--accent', bg: '--bg', surface: '--surface',
      text: '--text', muted: '--muted', success: '--success', danger: '--danger',
    };
    for (const [k, v] of Object.entries(map)) if (theme[k]) root.style.setProperty(v, theme[k]);
    if (theme.radius != null) root.style.setProperty('--radius', `${theme.radius}px`);
    if (theme.font_heading) root.style.setProperty('--font-heading', theme.font_heading);
    if (theme.font_body) root.style.setProperty('--font-body', theme.font_body);
  }, [theme]);

  if (!theme || !layout) return <p className="muted">Loading…</p>;

  const save = async (group, value) => {
    setBusy(true);
    try { await apiFetch('/api/admin/settings', { method: 'PUT', body: { group, value } }); toast('Saved — refresh the shop to see it live'); }
    catch (e) { toast(e.message, 'err'); } finally { setBusy(false); }
  };

  const move = (i, dir) => {
    const next = [...layout.sections];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setLayout({ ...layout, sections: next });
  };

  const COLOURS = [
    ['primary', 'Primary (buttons, nav)'], ['accent', 'Accent (highlights)'], ['bg', 'Page background'],
    ['surface', 'Card background'], ['text', 'Text'], ['muted', 'Muted text'],
    ['success', 'Success'], ['danger', 'Danger'],
  ];

  return (
    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }}>
      <div className="stack">
        <div className="card pad">
          <b>Colour presets</b>
          <div className="row wrap-gap" style={{ marginTop: 12 }}>
            {PRESETS.map((p) => (
              <button key={p.name} className="chip" onClick={() => setTheme({ ...theme, ...p.theme })}>
                <span style={{ display: 'inline-flex', gap: 3 }}>
                  {['primary', 'accent', 'bg'].map((k) => (
                    <i key={k} style={{ width: 10, height: 10, borderRadius: 3, background: p.theme[k], display: 'inline-block' }} />
                  ))}
                </span>
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="card pad">
          <b>Fine tune colours</b>
          <div className="grid grid-2" style={{ gap: 12, marginTop: 12 }}>
            {COLOURS.map(([key, label]) => (
              <label key={key} className="field">
                {label}
                <span className="row" style={{ gap: 8 }}>
                  <input type="color" value={theme[key] || '#000000'} onChange={(e) => setTheme({ ...theme, [key]: e.target.value })}
                         style={{ width: 44, height: 38, border: '1px solid var(--line)', borderRadius: 10, background: 'none', cursor: 'pointer' }} />
                  <input className="input" value={theme[key] || ''} onChange={(e) => setTheme({ ...theme, [key]: e.target.value })} />
                </span>
              </label>
            ))}
          </div>

          <div className="form-grid" style={{ marginTop: 14 }}>
            <label className="field">Heading font
              <select className="input" value={theme.font_heading} onChange={(e) => setTheme({ ...theme, font_heading: e.target.value })}>
                {FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </label>
            <label className="field">Corner roundness: {theme.radius}px
              <input type="range" min="0" max="32" value={theme.radius} onChange={(e) => setTheme({ ...theme, radius: Number(e.target.value) })} />
            </label>
          </div>

          <div className="row" style={{ gap: 10, marginTop: 14 }}>
            <button className="btn" disabled={busy} onClick={() => save('theme', theme)}>Save colours</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setTheme({ ...theme, ...PRESETS[0].theme }); }}>Reset to default</button>
          </div>
        </div>
      </div>

      <div className="stack">
        <div className="card pad">
          <b>Homepage structure</b>
          <p className="tiny muted" style={{ marginTop: 4 }}>Reorder or hide sections. This is exactly how the homepage will render.</p>
          <div className="stack" style={{ marginTop: 12, gap: 8 }}>
            {layout.sections.map((s, i) => (
              <div key={s.id} className="card pad row-between" style={{ padding: 12, boxShadow: 'none', opacity: s.visible === false ? 0.5 : 1 }}>
                <span className="row" style={{ gap: 10 }}>
                  <b className="muted tiny">{i + 1}</b>
                  <Icon name="layers" size={16} />
                  <b className="small">{s.label}</b>
                </span>
                <span className="row" style={{ gap: 6 }}>
                  <label className="switch">
                    <input type="checkbox" checked={s.visible !== false}
                           onChange={(e) => setLayout({ ...layout, sections: layout.sections.map((x) => x.id === s.id ? { ...x, visible: e.target.checked } : x) })} />
                    <span className="track" />
                  </label>
                  <button className="chip" onClick={() => move(i, -1)}>↑</button>
                  <button className="chip" onClick={() => move(i, 1)}>↓</button>
                </span>
              </div>
            ))}
          </div>
          <button className="btn" style={{ marginTop: 14 }} disabled={busy} onClick={() => save('layout', layout)}>Save layout</button>
        </div>

        <div className="card pad">
          <b>Live preview</b>
          <div className="card pad" style={{ marginTop: 12, background: 'var(--bg)' }}>
            <div className="eyebrow">Freshly baked</div>
            <h3 style={{ fontSize: '1.5rem' }}>Live making, <span style={{ color: 'var(--accent)' }}>Baked for You</span></h3>
            <p className="small muted" style={{ marginTop: 6 }}>This block uses the colours you picked above.</p>
            <div className="row wrap-gap" style={{ marginTop: 12 }}>
              <button className="btn btn-sm">Order Now</button>
              <button className="btn btn-primary btn-sm">Add to basket</button>
              <button className="btn btn-ghost btn-sm">Ghost</button>
              <span className="tag tag-veg">● Veg</span>
              <span className="tag tag-off">22% OFF</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
