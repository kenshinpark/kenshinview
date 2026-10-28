import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Rail from '../components/Rail.jsx';
import { tmdb, IMG } from '../tmdb.js';
import { load, loadSettings } from '../api.js';

const norm = (x, type) => ({
  id: x.id,
  title: x.title || x.name,
  mediaType: type,
  poster: IMG(x.poster_path, 'w342'),
  backdrop: IMG(x.backdrop_path, 'w780'),
  rating: x.vote_average,
  releaseDate: x.release_date || x.first_air_date,
});

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [hero, setHero] = useState(null);
  const [trending, setTrending] = useState([]);
  const [trendingTv, setTrendingTv] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularTv, setPopularTv] = useState([]);
  const [topMovies, setTopMovies] = useState([]);
  const [topTv, setTopTv] = useState([]);
  const [nowPlaying, setNowPlaying] = useState([]);
  const [airingToday, setAiringToday] = useState([]);
  const [continueWatching, setContinueWatching] = useState(() => load('cinrift_watchHistory', []));

  const refreshContinue = useCallback(() => {
    setContinueWatching(load('cinrift_watchHistory', []));
  }, []);

  useEffect(() => {
    refreshContinue();
    window.addEventListener('cinrift:watchhistory', refreshContinue);
    window.addEventListener('storage', refreshContinue);
    return () => {
      window.removeEventListener('cinrift:watchhistory', refreshContinue);
      window.removeEventListener('storage', refreshContinue);
    };
  }, [refreshContinue]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [trAll, trTv, popM, popT, topM, topT, nowM, airT] = await Promise.all([
          tmdb('/trending/movie/week'),
          tmdb('/trending/tv/week'),
          tmdb('/movie/popular'),
          tmdb('/tv/popular'),
          tmdb('/movie/top_rated'),
          tmdb('/tv/top_rated'),
          tmdb('/movie/now_playing'),
          tmdb('/tv/airing_today'),
        ]);
        if (cancelled) return;
        const tm = (trAll.results || []).map(x => norm(x, 'movie'));
        const tt = (trTv.results || []).map(x => norm(x, 'tv'));
        setTrending(tm);
        setTrendingTv(tt);
        setPopularMovies((popM.results||[]).map(x=>norm(x,'movie')));
        setPopularTv((popT.results||[]).map(x=>norm(x,'tv')));
        setTopMovies((topM.results||[]).map(x=>norm(x,'movie')));
        setTopTv((topT.results||[]).map(x=>norm(x,'tv')));
        setNowPlaying((nowM.results||[]).map(x=>norm(x,'movie')));
        setAiringToday((airT.results||[]).map(x=>norm(x,'tv')));
        const cand = tm[0] || tt[0];
        if (cand) setHero(cand);
      } catch (e) { console.error(e); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="loader">Loading…</div>;

  const settings = loadSettings();
  const continueRow = (settings.showContinueWatching && settings.watchHistory) ? continueWatching : [];

  return (
    <div>
      {hero && (
        <section className="hero">
          <img src={hero.backdrop || hero.poster} alt={hero.title} />
          <div className="overlay" />
          <div className="info">
            <h1>{hero.title}</h1>
            <p>{hero.title}</p>
            <div className="actions">
              <Link className="btn-primary" to={`/${hero.mediaType === 'tv' ? 'tv' : 'movie'}/${hero.id}/watch`}>Play</Link>
              <Link className="btn-secondary" to={`/${hero.mediaType === 'tv' ? 'tv' : 'movie'}/${hero.id}`}>More info</Link>
            </div>
          </div>
        </section>
      )}
      <Rail title="Continue Watching" items={continueRow} />
      <Rail title="Trending Movies" items={trending} />
      <Rail title="Trending TV Shows" items={trendingTv} />
      <Rail title="Now Playing" items={nowPlaying} />
      <Rail title="Airing Today" items={airingToday} />
      <Rail title="Popular Movies" items={popularMovies} />
      <Rail title="Popular TV Shows" items={popularTv} />
      <Rail title="Top Rated Movies" items={topMovies} />
      <Rail title="Top Rated TV Shows" items={topTv} />
    </div>
  );
}