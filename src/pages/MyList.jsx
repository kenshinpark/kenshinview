import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { load, store } from '../api.js';

export default function MyList() {
  const [items, setItems] = useState(load('cinrift_watchlist', []));

  useEffect(() => {
    const on = () => setItems(load('cinrift_watchlist', []));
    window.addEventListener('cinrift:watchlist', on);
    return () => window.removeEventListener('cinrift:watchlist', on);
  }, []);

  const remove = (it) => {
    const next = items.filter(x => !(x.tmdbId === it.tmdbId && x.mediaType === it.mediaType));
    store('cinrift_watchlist', next);
    setItems(next);
    window.dispatchEvent(new Event('cinrift:watchlist'));
  };

  return (
    <div>
      <h1>My List</h1>
      {items.length === 0 && <div className="empty">Nothing saved yet.</div>}
      <div className="grid">
        {items.map(it => (
          <div key={`${it.mediaType}-${it.tmdbId}`} className="card" tabIndex={0}>
            <Link to={`/${it.mediaType === 'tv' ? 'tv' : 'movie'}/${it.tmdbId}`}>
              <div className="poster">{it.poster ? <img src={it.poster} alt={it.title} /> : null}</div>
              <div className="title">{it.title}</div>
            {it.year ? <div className="card-year">{it.year}</div> : null}
            </Link>
            <button onClick={() => remove(it)} style={{width:'100%',borderRadius:0,border:'none',borderTop:'1px solid #333'}}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}