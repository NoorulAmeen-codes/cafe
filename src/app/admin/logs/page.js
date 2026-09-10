'use client';

import { useEffect, useState } from 'react';
import AdminShell, { useAdmin } from '@/components/AdminShell';
import { apiFetch } from '@/components/Providers';
import { Icon } from '@/components/Icon';

export default function AdminLogs() {
  return (
    <AdminShell title="Bugs & errors" subtitle="Anything that breaks on the site or in the API lands here automatically">
      <Body />
    </AdminShell>
  );
}

function Body() {
  const { toast } = useAdmin();
  const [logs, setLogs] = useState([]);
  const [open, setOpen] = useState(0);
  const [showResolved, setShowResolved] = useState(false);

  const load = () => apiFetch(`/api/admin/logs?resolved=${showResolved ? 1 : 0}`)
    .then((r) => { setLogs(r.logs); setOpen(r.open); })
    .catch((e) => toast(e.message, 'err'));

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [showResolved]);

  const resolve = async (log) => {
    try { await apiFetch('/api/admin/logs', { method: 'PATCH', body: { id: log.id, resolved: !log.resolved } }); load(); }
    catch (e) { toast(e.message, 'err'); }
  };

  const resolveAll = async () => {
    try { await apiFetch('/api/admin/logs', { method: 'PATCH', body: { all: true } }); toast('All marked resolved'); load(); }
    catch (e) { toast(e.message, 'err'); }
  };

  const clearResolved = async () => {
    try { await apiFetch('/api/admin/logs', { method: 'DELETE' }); toast('Resolved logs cleared'); load(); }
    catch (e) { toast(e.message, 'err'); }
  };

  const testError = async () => {
    await fetch('/api/log', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Test notification from the admin panel', detail: 'Raised manually to check the bug feed works.', url: '/admin/logs' }),
    });
    toast('Test error raised'); load();
  };

  return (
    <>
      <div className="card pad row-between wrap-gap" style={{ marginBottom: 16, borderLeft: `5px solid ${open ? 'var(--danger)' : 'var(--success)'}` }}>
        <div className="row" style={{ gap: 14 }}>
          <Icon name="bug" size={24} />
          <div>
            <b>{open === 0 ? 'No open issues 🎉' : `${open} open issue${open > 1 ? 's' : ''}`}</b>
            <p className="tiny muted" style={{ marginTop: 4 }}>
              Client crashes, failed API calls and server errors are captured automatically with the page and stack trace.
            </p>
          </div>
        </div>
        <div className="row wrap-gap">
          <button className={'chip' + (showResolved ? ' active' : '')} onClick={() => setShowResolved((v) => !v)}>Show resolved</button>
          <button className="btn btn-ghost btn-sm" onClick={testError}>Raise test error</button>
          <button className="btn btn-ghost btn-sm" onClick={resolveAll}>Mark all resolved</button>
          <button className="btn btn-ghost btn-sm" onClick={clearResolved}>Clear resolved</button>
        </div>
      </div>

      <div className="stack">
        {logs.map((l) => (
          <div key={l.id} className="card pad" style={{ borderLeft: `4px solid ${l.resolved ? 'var(--success)' : l.level === 'warn' ? 'var(--accent)' : 'var(--danger)'}` }}>
            <div className="row-between wrap-gap">
              <div>
                <div className="row" style={{ gap: 8 }}>
                  <span className={'tag ' + (l.level === 'warn' ? 'tag-eggless' : 'tag-off')}>{l.level}</span>
                  <span className="tag tag-plain">{l.source}</span>
                  <b className="small">{l.message}</b>
                </div>
                <div className="tiny muted" style={{ marginTop: 6 }}>
                  {new Date(l.created_at + 'Z').toLocaleString('en-IN')}{l.url ? ` · ${l.url}` : ''}
                </div>
              </div>
              <button className="chip" onClick={() => resolve(l)}>
                {l.resolved ? 'Reopen' : <><Icon name="check" size={14} /> Resolve</>}
              </button>
            </div>
            {l.detail && (
              <pre className="tiny muted" style={{ marginTop: 10, whiteSpace: 'pre-wrap', maxHeight: 160, overflow: 'auto', background: 'var(--bg)', padding: 10, borderRadius: 10 }}>
                {l.detail}
              </pre>
            )}
          </div>
        ))}
        {logs.length === 0 && <div className="card pad center muted" style={{ padding: 40 }}>Nothing logged — the site is behaving.</div>}
      </div>
    </>
  );
}
