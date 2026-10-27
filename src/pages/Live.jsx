import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Rail from '../components/Rail.jsx';
import { tmdb, IMG } from '../tmdb.js';

const norm = (x) => ({ id:x.id, title:x.name||x.title, mediaType:'tv', poster:IMG(x.poster_path,'w342'), rating:x.vote_average });

export default function Live() {
  const [airing, setAiring] = useState([]);
  const [onair, setOnair] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [a,b] = await Promise.all([tmdb('/tv/airing_today'), tmdb('/tv/on_the_air')]);
        if (cancelled) return;
        setAiring((a.results||[]).map(norm));
        setOnair((b.results||[]).map(norm));
      } catch (e) { console.error(e); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="loader">Loading…</div>;
  return (
    <div>
      <h1>Live TV</h1>
      <p style={{color:'var(--muted)'}}>Currently airing TV shows.</p>
      <Rail title="Airing Today" items={airing} />
      <Rail title="On The Air" items={onair} />
      <h2 style={{marginTop:24}}>All live channels</h2>
      <div className="grid">
        {onair.slice(0,24).map(it => (
          <Link key={`tv-${it.id}`} to={`/tv/${it.id}`} className="card" tabIndex={0}>
            <div className="poster">{it.poster ? <img src={it.poster} alt={it.title} /> : null}</div>
            <div className="title">{it.title}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}