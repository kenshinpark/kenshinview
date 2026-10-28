import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { load, store } from '../api.js';
import { tmdb, IMG as TMDB_IMG } from '../tmdb.js';

export default function Detail({ type }) {
  const { id } = useParams();
  const nav = useNavigate();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seasons, setSeasons] = useState([]);
  const [season, setSeason] = useState(1);
  const [episodeSel, setEpisodeSel] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [tmdbId, setTmdbId] = useState(null);
  const [saved, setSaved] = useState(false);
  const [similar, setSimilar] = useState([]);

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const media = type === 'tv' ? 'tv' : 'movie';
        const full = await tmdb(`/${media}/${id}`, { append_to_response: 'recommendations' });
        setDetail(full);
        setTmdbId(full.id);
        const list = load('cinrift_watchlist', []);
        setSaved(list.some(x => x.tmdbId === full.id && x.mediaType === media));
        if (media === 'tv') {
          const valid = (full.seasons || []).filter(s => s.season_number > 0);
          setSeasons(valid.length ? valid : (full.seasons || []));
          const first = valid.length ? valid[0] : (full.seasons || [])[0];
          if (first) setSeason(first.season_number);
        }
        let sim = (full.recommendations && full.recommendations.results) || [];
        if (!sim.length) {
          try {
            const rec = await tmdb(`/${media}/${id}/recommendations`);
            sim = rec.results || [];
          } catch {}
        }
        setSimilar((sim || []).slice(0, 16));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [id, type]);

  useEffect(() => {
    if (type !== 'tv' || !tmdbId || season < 1) return;
    (async () => {
      try {
        const data = await tmdb(`/tv/${tmdbId || id}/season/${season}`);
        const eps = Array.isArray(data.episodes) ? data.episodes : [];
        setEpisodes(eps);
        setEpisodeSel(eps.length ? eps[0].episode_number : 1);
      } catch (e) {
        console.error(e);
        setEpisodes([]);
        setEpisodeSel(1);
      }
    })();
  }, [season, tmdbId, type, id]);

  if (loading) return <div className="loader">Loading…</div>;
  if (!detail) return <div className="empty">Not found.</div>;

  const media = type === 'tv' ? 'tv' : 'movie';
  const title = detail.title || detail.name;
  const year = (detail.release_date || detail.first_air_date || '').slice(0,4);
  const backdrop = TMDB_IMG(detail.backdrop_path, 'w780');
  const poster = TMDB_IMG(detail.poster_path, 'w500');
  const rating = detail.vote_average;
  const tid = tmdbId || detail.id || Number(id);
  const toggleSave = () => {
    const list = load('cinrift_watchlist', []);
    const item = { tmdbId: tid, mediaType: media, title, year, poster, backdrop, rating };
    let next;
    if (saved) next = list.filter(x => !(x.tmdbId === tid && x.mediaType === media));
    else next = [...list, item];
    store('cinrift_watchlist', next);
    setSaved(!saved);
    window.dispatchEvent(new Event('cinrift:watchlist'));
  };

  const playPath = media === 'tv'
    ? `/tv/${tid}/watch?season=${season}&episode=${episodeSel}`
    : `/movie/${tid}/watch`;

  const imgPath = (p, size='w300') => TMDB_IMG(p, size);

  return (
    <div>
      <div style={{marginBottom:16}}>
        <Link to="/" className="back-btn">← Back</Link>
      </div>
      <section className="hero" style={{minHeight:'40vh'}}>
        {backdrop && <img src={backdrop} alt={title} />}
        <div className="overlay" />
        <div className="info">
          <h1>{title}</h1>
          {media === 'tv' && (
            <div className="hero-meta">
              {year && <span>{year}</span>}
              {rating && <span>★ {rating.toFixed(1)}</span>}
              {detail.genres && <span>{detail.genres.map(g=>g.name).join(', ')}</span>}
            </div>
          )}
          <p>{detail.overview}</p>
          <div className="actions">
            <button className="btn-primary" onClick={() => nav(playPath)}>Play</button>
            <button className="btn-secondary" onClick={toggleSave}>{saved ? 'Saved' : 'Add to List'}</button>
          </div>
        </div>
      </section>

      {media === 'tv' && (
        <>
          {/* Season selector just below the overlay/hero */}
          {seasons.length > 0 && (
            <div className="season-bar">
              <label>Season <select value={season} onChange={e=>setSeason(Number(e.target.value))} className="control-select">
                {seasons.map(s => <option key={s.id} value={s.season_number}>Season {s.season_number}</option>)}
              </select></label>
            </div>
          )}

          {/* Episodes: full-width rows */}
          {episodes.length > 0 && (
            <div className="episodes-grid">
              {episodes.map(ep => (
                <Link key={ep.id} to={`/tv/${id}/watch?season=${season}&episode=${ep.episode_number}`} className="card card-ep-full">
                  <div className="poster" style={{width:200, height:120, flexShrink:0}}>{ep.still_path ? <img src={imgPath(ep.still_path,'w300')} alt={ep.name} /> : null}</div>
                  <div className="title">E{ep.episode_number} {ep.name}</div>
                </Link>
              ))}
            </div>
          )}

          {episodes.length === 0 && seasons.length > 0 && (
            <p style={{color:'var(--muted)',fontSize:13,marginTop:24,marginBottom:24}}>No episodes available for this season.</p>
          )}
        </>
      )}

      {media !== 'tv' && (
        <>        {/* Movies use the same overlay layout as series, without season/episode selector */}
        {backdrop && <img src={backdrop} alt={title} />}
        <div className="overlay" />
        <div className="info">
          <h1>{title}</h1>
          <div className="hero-meta">
            {year && <span>{year}</span>}
            {rating && <span>★ {rating.toFixed(1)}</span>}
            {detail.genres && <span>{detail.genres.map(g=>g.name).join(', ')}</span>}
          </div>
          <p>{detail.overview}</p>
          <div className="actions">
            <button className="btn-primary" onClick={() => nav(playPath)}>Play</button>
            <button className="btn-secondary" onClick={toggleSave}>{saved ? 'Saved' : 'Add to List'}</button>
          </div>
        </div>
      </>)}

      {similar.length > 0 && (
        <section style={{marginTop:24}}>
          <h2>More like this</h2>
          <div className="row">
            {similar.map(r => (
              <Link key={r.id} to={`/${r.first_air_date?'tv':'movie'}/${r.id}`} className="card card-sm">
                <div className="poster">{r.poster_path ? <img src={imgPath(r.poster_path,'w300')} alt={r.title||r.name} /> : null}</div>
                <div className="title">{r.title||r.name}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
