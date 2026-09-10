import { NextResponse } from 'next/server';
import { logEvent } from './db.js';

export function ok(data = {}, init = {}) {
  return NextResponse.json({ ok: true, ...data }, init);
}

export function fail(message, status = 400, extra = {}) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

/** Wraps a route handler so unexpected errors land in the admin bug feed. */
export function handler(fn) {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      const status = err.status || 500;
      if (status >= 500) {
        logEvent({
          level: 'error',
          source: 'api',
          message: err.message || 'Unhandled API error',
          detail: err.stack || '',
          url: req?.url || '',
        });
      }
      return fail(err.message || 'Something went wrong', status);
    }
  };
}

export async function body(req) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

export function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function bool(v) {
  return v === true || v === 1 || v === '1' || v === 'true' ? 1 : 0;
}

export function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}
