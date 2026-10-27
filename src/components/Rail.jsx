import React from 'react';
import { Link } from 'react-router-dom';

export default function Rail({ title, items }) {
  if (!items || !items.length) return null;
  return (
    <section className="rail">
      <h2>{title}</h2>
      <div className="row">
        {items.map(it => (
          <Link key={`${it.mediaType}-${it.id}`} to={`/${it.mediaType === 'tv' ? 'tv' : 'movie'}/${it.id}`} className="card" tabIndex={0}>
            <div className="poster">
              {it.poster ? <img src={it.poster} alt={it.title} /> : null}
            </div>
            <div className="title">{it.title}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}