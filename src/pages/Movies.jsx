import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Rail from '../components/Rail.jsx';
import { tmdb, IMG } from '../tmdb.js';

const norm = (x, type='movie') => ({ id:x.id, title:x.title||x.name, mediaType:type, poster:IMG(x.poster_path,'w342'), rating:x.vote_average, releaseDate:x.release_date });

export default function Movies() {
  const [popular, setPopular] = useState([]);
  const [top, setTop] = useState([]);
  const [now, setNow] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [a,b,c,d] = await Promise.all([
          tmdb('/movie/popular'),
          tmdb('/movie/top_rated'),
          tmdb('/movie/now_playing'),
          tmdb('/movie/upcoming'),
        ]);
        if (cancelled) return;
        setPopular((a.results||[]).map(x=>norm(x)));
        setTop((b.results||[]).map(x=>norm(x)));
        setNow((c.results||[]).map(x=>norm(x)));
        setUpcoming((d.results||[]).map(x=>norm(x)));
      } catch (e) { console.error(e); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="loader">Loading…</div>;

  const grid = popular.slice(0, 24);
  return (
    <div>
      <h1>Movies</h1>
      <div className="grid" style={{marginBottom:24}}>
        {grid.map(it => (
          <Link key={`movie-${it.id}`} to={`/movie/${it.id}`} className="card" tabIndex={0}>
            <div className="poster">{it.poster ? <img src={it.poster} alt={it.title} /> : null}</div>
            <div className="title">{it.title}</div>
          </Link>
        ))}
      </div>
      <Rail title="Top Rated" items={top} />
      <Rail title="Now Playing" items={now} />
      <Rail title="Upcoming" items={upcoming} />
    </div>
  );
}