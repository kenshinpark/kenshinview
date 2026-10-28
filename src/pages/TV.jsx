import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Rail from '../components/Rail.jsx';
import { tmdb, IMG } from '../tmdb.js';

const norm = (x, type='tv') => ({ id:x.id, title:x.name||x.title, mediaType:type, poster:IMG(x.poster_path,'w342'), rating:x.vote_average, releaseDate:x.first_air_date, year:(x.first_air_date||'').slice(0,4) });

export default function TV() {
  const [popular, setPopular] = useState([]);
  const [top, setTop] = useState([]);
  const [airing, setAiring] = useState([]);
  const [onair, setOnair] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [a,b,c,d] = await Promise.all([
          tmdb('/tv/popular'),
          tmdb('/tv/top_rated'),
          tmdb('/tv/airing_today'),
          tmdb('/tv/on_the_air'),
        ]);
        if (cancelled) return;
        setPopular((a.results||[]).map(x=>norm(x)));
        setTop((b.results||[]).map(x=>norm(x)));
        setAiring((c.results||[]).map(x=>norm(x)));
        setOnair((d.results||[]).map(x=>norm(x)));
      } catch (e) { console.error(e); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="loader">Loading…</div>;

  return (
    <div>
      <h1>TV Shows</h1>
      <div className="grid" style={{marginBottom:24}}>
        {popular.slice(0,24).map(it => (
          <Link key={`tv-${it.id}`} to={`/tv/${it.id}`} className="card" tabIndex={0}>
            <div className="poster">{it.poster ? <img src={it.poster} alt={it.title} /> : null}</div>
            <div className="title">{it.title}</div>
            {it.year ? <div className="card-year">{it.year}</div> : null}
          </Link>
        ))}
      </div>
      <Rail title="Airing Today" items={airing} />
      <Rail title="On The Air" items={onair} />
      <Rail title="Top Rated" items={top} />
    </div>
  );
}