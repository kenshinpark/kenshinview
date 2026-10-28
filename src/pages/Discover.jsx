import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { tmdb, IMG } from '../tmdb.js';
import { loadSettings, saveSettings } from '../api.js';

const GENRES_MOVIE = [
  {id:28,name:'Action'},{id:12,name:'Adventure'},{id:16,name:'Animation'},{id:35,name:'Comedy'},
  {id:18,name:'Drama'},{id:27,name:'Horror'},{id:878,name:'Sci-Fi'},{id:53,name:'Thriller'},
  {id:10749,name:'Romance'},{id:99,name:'Documentary'}
];
const GENRES_TV = [
  {id:10759,name:'Action & Adventure'},{id:35,name:'Comedy'},{id:18,name:'Drama'},
  {id:10765,name:'Sci-Fi & Fantasy'},{id:9648,name:'Mystery'},{id:10768,name:'War & Politics'},
  {id:16,name:'Animation'},{id:99,name:'Documentary'}
];

const COUNTRIES = [
  {code:'US',name:'United States'},
  {code:'GB',name:'United Kingdom'},
  {code:'JP',name:'Japan'},
  {code:'KR',name:'South Korea'},
  {code:'FR',name:'France'},
  {code:'DE',name:'Germany'},
  {code:'IN',name:'India'},
  {code:'CN',name:'China'},
  {code:'ES',name:'Spain'},
  {code:'IT',name:'Italy'},
  {code:'AU',name:'Australia'},
  {code:'CA',name:'Canada'},
  {code:'BR',name:'Brazil'},
  {code:'MX',name:'Mexico'},
  {code:'HK',name:'Hong Kong'},
  {code:'TW',name:'Taiwan'},
];
export default function Discover() {
  const [type, setType] = useState('movie');
  const [genre, setGenre] = useState('');
  const [country, setCountry] = useState('');
  const [hideUnreleased, setHideUnreleased] = useState(() => loadSettings().hideUnreleased);
  const [year, setYear] = useState('');
  const [rating, setRating] = useState('');
  const [sort, setSort] = useState('popular');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Keep local filter in sync with the global preference (updated on the Settings page).
  useEffect(() => {
    const refresh = () => setHideUnreleased(loadSettings().hideUnreleased);
    window.addEventListener('cinrift:settings', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('cinrift:settings', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const sortMap = {
    popular: 'popularity.desc',
    rating: 'vote_average.desc',
    latest: type === 'movie' ? 'primary_release_date.desc' : 'first_air_date.desc',
  };

  const fetchPage = async (p, replace=false) => {
    setLoading(true);
    try {
      const params = { page: p, sort_by: sortMap[sort] || 'popularity.desc' };
      if (genre) params.with_genres = genre;
      if (year) {
        if (type === 'movie') params.primary_release_year = year;
        else params.first_air_date_year = year;
      }
      if (rating) params['vote_average.gte'] = rating;
      if (rating) params['vote_count.gte'] = 50;
      if (country) params.with_origin_country = country;
      if (hideUnreleased) {
        const today = new Date().toISOString().slice(0, 10);
        if (type === 'movie') params['primary_release_date.lte'] = today;
        else params['first_air_date.lte'] = today;
      }
      const path = type === 'movie' ? '/discover/movie' : '/discover/tv';
      const data = await tmdb(path, params);
      const norm = (x) => ({ id:x.id, title: x.title||x.name, mediaType: type, poster: IMG(x.poster_path,'w342'), rating: x.vote_average });
      const list = (data.results||[]).map(norm);
      setItems(prev => replace ? list : [...prev, ...list]);
      setTotalPages(data.total_pages || 1);
      setPage(p);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPage(1, true); }, [type, genre, country, hideUnreleased, year, rating, sort]);

  return (
    <div>
      <h1>Discover</h1>
      <div className="filters">
        <select className="control-select" value={type} onChange={e=>setType(e.target.value)}>
          <option value="movie">Movies</option>
          <option value="tv">TV shows</option>
        </select>
        <select value={genre} onChange={e=>setGenre(e.target.value)}>
          <option value="">Any genre</option>
          {(type === 'movie' ? GENRES_MOVIE : GENRES_TV).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <select value={country} onChange={e=>setCountry(e.target.value)}>
          <option value="">Any country</option>
          {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
        <label style={{display:'inline-flex',alignItems:'center',gap:8,fontSize:13,whiteSpace:'nowrap',padding:'8px 12px',borderRadius:999,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.14)'}}>
          <input type="checkbox" checked={hideUnreleased} onChange={e => {
            const v = e.target.checked;
            setHideUnreleased(v);
            try { saveSettings({ ...loadSettings(), hideUnreleased: v }); } catch {}
          }} />
          Hide unreleased
        </label>
        <input placeholder="Year" value={year} onChange={e=>setYear(e.target.value)} style={{width:90}} />
        <select value={rating} onChange={e=>setRating(e.target.value)}>
          <option value="">Any rating</option>
          {[9,8,7,6,5].map(r => <option key={r} value={r}>{r}+</option>)}
        </select>
        <select value={sort} onChange={e=>setSort(e.target.value)}>
          <option value="popular">Popular</option>
          <option value="rating">Top rated</option>
          <option value="latest">Latest</option>
        </select>
      </div>
      <div className="grid">
        {items.map(it => (
          <Link key={`${it.mediaType}-${it.id}`} to={`/${it.mediaType === 'tv' ? 'tv' : 'movie'}/${it.id}`} className="card" tabIndex={0}>
            <div className="poster">{it.poster ? <img src={it.poster} alt={it.title} /> : null}</div>
            <div className="title">{it.title}</div>
          </Link>
        ))}
      </div>
      {loading && <div className="loader">Loading…</div>}
      {!loading && page < totalPages && (
        <div style={{textAlign:'center',marginTop:16}}>
          <button onClick={() => fetchPage(page+1)}>Load more</button>
        </div>
      )}
    </div>
  );
}