'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminShell, { useAdmin, ImageInput } from '@/components/AdminShell';
import { apiFetch } from '@/components/Providers';
import { Icon } from '@/components/Icon';

const EMPTY = {
  name: '', category: 'cakes', description: '', price: '', mrp: '', unit: '1 piece', image: '',
  veg: 1, eggless: 0, bestseller: 0, customizable: 0, stock: 0, low_stock_at: 5, track_stock: 1, active: 1,
};

export default function AdminProducts() {
  return (
    <AdminShell title="Products & stock" subtitle="Add, edit, remove bakes and keep the counter stock accurate">
      <Body />
    </AdminShell>
  );
}

function Body() {
  const { toast } = useAdmin();
  const [data, setData] = useState({ products: [], categories: [] });
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [view, setView] = useState('list');
  const [saving, setSaving] = useState(false);

  const load = () => apiFetch('/api/admin/products').then(setData).catch((e) => toast(e.message, 'err'));
  useEffect(() => { load(); }, []);

  const list = useMemo(() => {
    let out = data.products;
    if (cat !== 'all') out = out.filter((p) => p.category === cat);
    if (q.trim()) out = out.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
    return out;
  }, [data.products, cat, q]);

  const save = async (form) => {
  setSaving(true);

  try {
    if (form.id) {
      await apiFetch(`/api/admin/products/${form.id}`, {
        method: 'PUT',
        body: form,
      });
    } else {
      await apiFetch('/api/admin/products', {
        method: 'POST',
        body: form,
      });
    }

    toast(form.id ? 'Product updated' : 'Product added');
    setEditing(null);
    load();
  } catch (e) {
    toast(e.message, 'err');
  } finally {
    setSaving(false);
  }
};

  const remove = async (p) => {
    if (!confirm(`Hide "${p.name}" from the shop?`)) return;
    try {
      await apiFetch(`/api/admin/products/${p.id}`, { method: 'DELETE' });
     toast('Product hidden from the shop');  load();
    } catch (e) { toast(e.message, 'err'); }
  };

  const nudge = async (p, delta) => {
    try {
      await apiFetch(`/api/admin/products/${p.id}`, { method: 'PATCH', body: { delta } });
      load();
    } catch (e) { toast(e.message, 'err'); }
  };

  const toggle = async (p, field) => {
    try {
      await apiFetch(`/api/admin/products/${p.id}`, { method: 'PUT', body: { [field]: p[field] ? 0 : 1 } });
      load();
    } catch (e) { toast(e.message, 'err'); }
  };

  return (
    <>
      <div className="card pad row-between wrap-gap" style={{ marginBottom: 16 }}>
        <div className="row wrap-gap">
          <button className={'chip' + (cat === 'all' ? ' active' : '')} onClick={() => setCat('all')}>All ({data.products.length})</button>
          {data.categories.map((c) => (
            <button key={c.id} className={'chip' + (cat === c.slug ? ' active' : '')} onClick={() => setCat(c.slug)}>{c.name}</button>
          ))}
        </div>
        <div className="row wrap-gap admin-products-actions">
  <input
    className="input"
    style={{ width: 200 }}
    placeholder="Search products…"
    value={q}
    onChange={(e) => setQ(e.target.value)}
  />

  <button
    className={'chip' + (view === 'stock' ? ' active' : '')}
    onClick={() => setView(view === 'stock' ? 'list' : 'stock')}
  >
    <Icon name="box" size={14} /> Stock mode
  </button>

  <button
    className="btn btn-sm"
    onClick={() => setEditing({ ...EMPTY })}
  >
    <Icon name="plus" size={15} /> Add product
  </button>
</div>
      </div>

      <div className="card pad" style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Product</th><th>Category</th><th>Price</th>
              <th>Stock</th><th>Flags</th><th>Live</th><th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="row" style={{ gap: 10 }}>
                    <img src={p.image} alt="" style={{ width: 42, height: 42, borderRadius: 10, objectFit: 'cover' }} />
                    <span><b>{p.name}</b><div className="tiny muted">{p.unit}</div></span>
                  </div>
                </td>
                <td className="small" style={{ textTransform: 'capitalize' }}>{p.category}</td>
                <td>
                  <b>₹{p.price}</b>
                  {p.mrp > p.price && <div className="tiny strike">₹{p.mrp}</div>}
                </td>
                <td>
                  {p.track_stock ? (
                    view === 'stock' ? (
                      <div className="row" style={{ gap: 6 }}>
                        <button className="chip" style={{ padding: '4px 10px' }} onClick={() => nudge(p, -1)}>−</button>
                        <b style={{ minWidth: 28, textAlign: 'center' }}>{p.stock}</b>
                        <button className="chip" style={{ padding: '4px 10px' }} onClick={() => nudge(p, 1)}>+</button>
                        <button className="chip" style={{ padding: '4px 10px' }} onClick={() => nudge(p, 10)}>+10</button>
                      </div>
                    ) : (
                      <span className={'stock-pill ' + (p.stock <= 0 ? 'stock-out' : p.stock <= p.low_stock_at ? 'stock-low' : '')}>
                        {p.stock <= 0 ? 'Sold out' : `${p.stock} in stock`}
                      </span>
                    )
                  ) : <span className="tiny muted">Not tracked</span>}
                </td>
                <td>
                  <div className="row" style={{ gap: 4 }}>
                    <button className={'chip tiny' + (p.bestseller ? ' active' : '')} style={{ padding: '3px 8px' }} onClick={() => toggle(p, 'bestseller')}>★</button>
                    <button className={'chip tiny' + (p.eggless ? ' active' : '')} style={{ padding: '3px 8px' }} onClick={() => toggle(p, 'eggless')}>Eggless</button>
                    <button className={'chip tiny' + (p.customizable ? ' active' : '')} style={{ padding: '3px 8px' }} onClick={() => toggle(p, 'customizable')}>Custom</button>
                  </div>
                </td>
                <td>
                  <label className="switch">
                    <input type="checkbox" checked={!!p.active} onChange={() => toggle(p, 'active')} />
                    <span className="track" />
                  </label>
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className="chip" onClick={() => setEditing(p)}><Icon name="edit" size={14} /> Edit</button>{' '}
                  <button className="chip" style={{ color: 'var(--danger)' }} onClick={() => remove(p)}><Icon name="trash" size={14} /></button>
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={7} className="center muted">No products match</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <ProductModal
        initial={editing}
        categories={data.categories}
        onClose={() => setEditing(null)}
        onSave={save}
        saving={saving}
      />
      )}
    </>
  );
}

function ProductModal({ initial, categories, onClose, onSave, saving }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? (e.target.checked ? 1 : 0) : e.target.value });

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal pad" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620 }}>
        <div className="row-between">
          <h3>{form.id ? 'Edit product' : 'New product'}</h3>
          <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={onClose}><Icon name="close" size={16} /></button>
        </div>

        <div className="stack" style={{ marginTop: 16 }}>
          <label className="field">Name<input className="input" value={form.name} onChange={set('name')} /></label>

          <div className="form-grid">
            <label className="field">Category
              <select className="input" value={form.category} onChange={set('category')}>
                {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
            </label>
            <label className="field">Unit / size<input className="input" value={form.unit} onChange={set('unit')} placeholder="1 kg / 1 piece" /></label>
          </div>

         <div className="form-grid">
          <label className="field">
            Selling price ₹
            <input
              className="input"
              type="number"
              min="1"
              max="1000000"
              value={form.price}
              onChange={set('price')}
            />
          </label>

          <label className="field">
            MRP ₹ (optional, shows a discount)
            <input
              className="input"
              type="number"
              min="0"
              max="1000000"
              value={form.mrp ?? ''}
              onChange={set('mrp')}
            />
          </label>
        </div>

          <label className="field">Description<textarea className="input" value={form.description} onChange={set('description')} /></label>

          <ImageInput value={form.image} onChange={(v) => setForm({ ...form, image: v })} label="Product photo" />

         <div className="form-grid">
          <label className="field">
            Stock on hand
            <input
              className="input"
              type="number"
              min="0"
              max="1000000"
              value={form.stock}
              onChange={set('stock')}
            />
          </label>

          <label className="field">
            Low stock warning at
            <input
              className="input"
              type="number"
              min="0"
              max="1000000"
              value={form.low_stock_at}
              onChange={set('low_stock_at')}
            />
          </label>
        </div>

          <div className="row wrap-gap" style={{ gap: 18 }}>
            <label className="switch"><input type="checkbox" checked={!!form.track_stock} onChange={set('track_stock')} /><span className="track" /><span className="small">Track stock</span></label>
            <label className="switch"><input type="checkbox" checked={!!form.veg} onChange={set('veg')} /><span className="track" /><span className="small">Veg</span></label>
            <label className="switch"><input type="checkbox" checked={!!form.eggless} onChange={set('eggless')} /><span className="track" /><span className="small">Eggless</span></label>
            <label className="switch"><input type="checkbox" checked={!!form.bestseller} onChange={set('bestseller')} /><span className="track" /><span className="small">Bestseller</span></label>
            <label className="switch"><input type="checkbox" checked={!!form.customizable} onChange={set('customizable')} /><span className="track" /><span className="small">Customisable</span></label>
            <label className="switch"><input type="checkbox" checked={!!form.active} onChange={set('active')} /><span className="track" /><span className="small">Show on site</span></label>
          </div>

          <div className="row" style={{ gap: 10, marginTop: 6 }}>
            <button
            className="btn grow"
            disabled={saving}
            onClick={() => onSave(form)}
          >
            {saving ? 'Saving…' : form.id ? 'Save changes' : 'Add product'}
          </button>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
