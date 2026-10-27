import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { tmdb, IMG } from '../tmdb.js';

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) { setItems([]); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await tmdb('/search/multi', { query: q, page: 1 });
        if (cancelled) return;
        const list = (data.results || [])
          .filter(r => r.media_type === 'movie' || r.media_type === 'tv')
          .map(r => ({
            id: r.id,
            title: r.title || r.name,
            mediaType: r.media_type,
            poster: IMG(r.poster_path, 'w342'),
          }));
        setItems(list);
      } catch (e) { console.error(e); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [q]);

  return (
    <div>
      <h1>Search: {q}</h1>
      {loading && <div className="loader">Searching…</div>}
      <div className="grid">
        {items.map(it => (
          <Link key={`${it.mediaType}-${it.id}`} to={`/${it.mediaType === 'tv' ? 'tv' : 'movie'}/${it.id}`} className="card" tabIndex={0}>
            <div className="poster">{it.poster ? <img src={it.poster} alt={it.title} /> : null}</div>
            <div className="title">{it.title}</div>
          </Link>
        ))}
      </div>
      {!loading && items.length === 0 && q && <div className="empty">No results.</div>}
    </div>
  );
}