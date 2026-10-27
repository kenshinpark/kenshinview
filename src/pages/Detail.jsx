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

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const media = type === 'tv' ? 'tv' : 'movie';
        const data = await tmdb(`/${media}/${id}`, { append_to_response: 'credits,videos,recommendations' });
        // append_to_response handled as extra param sometimes; fetch seasons separately for tv
        const full = await tmdb(`/${media}/${id}`);
        setDetail({ ...full, ...data });
        setTmdbId((full.id || data.id));
        const list = load('cinrift_watchlist', []);
        const mid = full.id || data.id;
        setSaved(list.some(x => x.tmdbId === mid && x.mediaType === media));
        if (media === 'tv') {
          try {
            const withSeasons = await tmdb(`/${media}/${id}`);
            const valid = (withSeasons.seasons || []).filter(s => s.season_number > 0);
            setSeasons(valid.length ? valid : (withSeasons.seasons || []));
            const first = valid.length ? valid[0] : (withSeasons.seasons || [])[0];
            if (first) setSeason(first.season_number);
          } catch {}
        }
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
    <div className="detail-hero">
      <div className="detail-poster-box">
        {poster && <img className="poster" src={poster} alt={title} />}
      </div>
      <div className="detail-info">
        <div className="detail-header">
          <h1>{title}</h1>
          <div className="detail-meta">
            <span>{year}</span>
            <span className="separator">•</span>
            <span className="rating">★ {rating?.toFixed?.(1)}</span>
            {detail.genres && <span className="genres">{detail.genres.map(g=>g.name).join(', ')}</span>}
          </div>
        </div>
        <p className="detail-overview">{detail.overview}</p>
        <div className="detail-actions">
          <button className="btn-primary" onClick={() => nav(playPath)}>Play Now</button>
          <button className="btn-secondary" onClick={toggleSave}>{saved ? '✓ Saved' : 'Add to List'}</button>
        </div>
        {media === 'tv' && (
          <div className="episode-selector">
            <div className="selector-row">
              <div className="selector-group">
                <label>Season</label>
                <select value={season} onChange={e=>setSeason(Number(e.target.value))} className="control-select">
                  {seasons.map(s => <option key={s.id} value={s.season_number}>Season {s.season_number}</option>)}
                </select>
              </div>
              <div className="selector-group">
                <label>Episode</label>
                <select value={episodeSel} onChange={e=>setEpisodeSel(Number(e.target.value))} className="control-select">
                  {episodes.map(ep => <option key={ep.id} value={ep.episode_number}>E{ep.episode_number}: {ep.name}</option>)}
                </select>
              </div>
            </div>
            {episodes.length > 0 && (
              <div className="episode-grid">
                {episodes.map(ep => (
                  <Link key={ep.id} to={`/tv/${id}/watch?season=${season}&episode=${ep.episode_number}`} className="card card-ep">
                    <div className="poster-thumb">
                      {ep.still_path ? <img src={imgPath(ep.still_path,'w300')} alt={ep.name} /> : null}
                    </div>
                    <div className="title">E{ep.episode_number} {ep.name}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}