import { APP_NAME } from './config.js';

// In web dev we use same-origin Vite proxy '/tmdb'. In Android (file://) call TMDB directly.
const isFile = typeof window !== 'undefined' && window.location.protocol === 'file:';

export async function api(path, opts = {}) {
  // legacy shim: paths like /api/... are not used anymore; kept for safety.
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }, ...opts });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const img = (p, size='w500') => p ? `https://image.tmdb.org/t/p/${size}${p}` : '';

export function store(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
export function load(key, fallback=[]) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; }
}

export const DEFAULT_UPSTREAM = '';
export { APP_NAME };