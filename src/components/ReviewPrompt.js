'use client';

import { useEffect, useState } from 'react';
import { useStore, apiFetch } from './Providers';
import { Icon, GoogleG } from './Icon';

/**
 * When a customer comes back to the site after an order was delivered we ask
 * them to rate it, then hand them straight over to the Google review page.
 */
export default function ReviewPrompt() {
  const { pendingReview, setPendingReview, shop, toast } = useStore();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (pendingReview) {
      const t = setTimeout(() => setOpen(true), 1200);
      return () => clearTimeout(t);
    }
  }, [pendingReview]);

  if (!pendingReview || !open) return null;

  const items = (() => {
    try { return JSON.parse(pendingReview.items || '[]'); } catch { return []; }
  })();
  const names = items.map((i) => i.name).join(', ') || 'your order';

  const submit = async () => {
    setBusy(true);
    try {
      const res = await apiFetch(`/api/orders/${pendingReview.id}/review`, {
        method: 'POST', body: { rating, text },
      });
      setDone(true);
      if (rating >= 4 && res.google_review_url) {
        window.open(res.google_review_url, '_blank', 'noopener');
      }
      toast('Thank you for the feedback!');
    } catch (e) {
      toast(e.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  const dismiss = async () => {
    setOpen(false);
    setPendingReview(null);
    try { await apiFetch(`/api/orders/${pendingReview.id}`, { method: 'PATCH', body: { action: 'dismiss_review' } }); } catch {}
  };

  return (
    <div className="modal-back" onClick={dismiss}>
      <div className="modal pad" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="row-between">
          <div className="eyebrow" style={{ margin: 0 }}>How did we do?</div>
          <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={dismiss}><Icon name="close" size={16} /></button>
        </div>

        {!done ? (
          <>
            <h3 style={{ margin: '10px 0 6px', fontSize: '1.4rem' }}>Rate your last order</h3>
            <p className="small muted">
              Order <b>{pendingReview.code}</b> — {names}. Your rating helps other cake lovers in Thachanady find us.
            </p>

            <div className="row" style={{ gap: 6, margin: '18px 0', justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  style={{
                    border: 'none', background: 'none', cursor: 'pointer', fontSize: 32, lineHeight: 1,
                    filter: n <= rating ? 'none' : 'grayscale(1)', opacity: n <= rating ? 1 : 0.35,
                  }}
                  aria-label={`${n} star`}
                >⭐</button>
              ))}
            </div>

            <textarea
              className="input" placeholder="Tell us what you loved (optional)"
              value={text} onChange={(e) => setText(e.target.value)}
            />

            <div className="row" style={{ marginTop: 14, gap: 10 }}>
              <button className="btn btn-block" onClick={submit} disabled={busy}>
                {busy ? 'Sending…' : 'Submit rating'}
              </button>
            </div>
            <p className="tiny muted center" style={{ marginTop: 10 }}>
              4★ and above opens the Google review page so you can post it there too.
            </p>
          </>
        ) : (
          <div className="center" style={{ padding: '14px 0' }}>
            <div style={{ fontSize: 44 }}>🎉</div>
            <h3 style={{ margin: '8px 0' }}>Thanks a lot!</h3>
            <p className="small muted">Would you share it on our Google listing as well?</p>
            <a
              className="btn btn-ghost" style={{ marginTop: 14 }}
              href={shop.google_review_url || shop.google_listing_url} target="_blank" rel="noreferrer"
            >
              <GoogleG /> Write a Google review
            </a>
            <div style={{ marginTop: 12 }}>
              <button className="link" onClick={dismiss}>No thanks</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
