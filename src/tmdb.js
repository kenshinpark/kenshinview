export const API_KEY = 'ef70d37dce29d0e44efdc5ae53b04a86';
export const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlZjcwZDM3ZGNlMjlkMGU0NGVmZGM1YWU1M2IwNGE4NiIsIm5iZiI6MTc5MzExMzkxMC40NjU5OTk4LCJzdWIiOiI2YWUwYmYzNjk0MTBmNzYzYjVlNmVkMjMiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.HbAuG16e5ApHXllje1M3s5lLM2lAHZEW340okoHHUKg';

export const IMG = (p, size='w500') => p ? `https://image.tmdb.org/t/p/${size}${p}` : '';

export async function tmdb(path, params = {}) {
  const url = new URL(`https://api.themoviedb.org/3${path}`);
  url.searchParams.set('api_key', API_KEY);
  Object.entries(params).forEach(([k,v]) => { if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v); });
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, Accept: 'application/json' }
  });
  if (!res.ok) throw new Error(`TMDB ${res.status} ${res.statusText}`);
  return res.json();
}