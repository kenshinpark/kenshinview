import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Movies from './pages/Movies.jsx';
import TV from './pages/TV.jsx';
import Discover from './pages/Discover.jsx';
import Detail from './pages/Detail.jsx';
import Watch from './pages/Watch.jsx';
import MyList from './pages/MyList.jsx';
import SearchPage from './pages/Search.jsx';
import Settings from './pages/Settings.jsx';
import Live from './pages/Live.jsx';

function Topbar() {
  const [q, setQ] = useState('');
  const nav = useNavigate();
  const submit = (e) => {
    e.preventDefault();
    if (q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`);
  };
  return (
    <header className="topbar">
      <Link to="/" className="brand">KenshinView</Link>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/movies">Movies</Link>
        <Link to="/tv">TV</Link>
        <Link to="/live">Live</Link>
        <Link to="/discover">Discover</Link>
        <Link to="/mylist">My List</Link>
        <Link to="/settings">Settings</Link>
      </nav>
      <form className="searchbox" onSubmit={submit}>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search" />
        <button type="submit">Go</button>
      </form>
    </header>
  );
}

function Shell() {
  const loc = useLocation();
  const isWatch = loc.pathname.includes('/watch');
  return (
    <div className="app-shell">
      {!isWatch && <Topbar />}
      <main className={isWatch ? 'content content-watch' : 'content'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/tv" element={<TV />} />
          <Route path="/live" element={<Live />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/mylist" element={<MyList />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/movie/:id" element={<Detail type="movie" />} />
          <Route path="/tv/:id" element={<Detail type="tv" />} />
          <Route path="/movie/:id/watch" element={<Watch type="movie" />} />
          <Route path="/tv/:id/watch" element={<Watch type="tv" />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}