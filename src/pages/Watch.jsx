import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { tmdb } from '../tmdb.js';

const EH = 'https://embed.vidrift.net';

export default function Watch() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const type = (window.location.hash || window.location.pathname).includes('/tv/') ? 'tv' : 'movie';
  const season = Number(params.get('season') || 1);
  const episode = Number(params.get('episode') || 1);
  const [title, setTitle] = useState('');
  const [src, setSrc] = useState(null);
  const [mouseOn, setMouseOn] = useState(false);
  const iframeRef = useRef(null);
  const playerRef = useRef(null);

  const isTv = type === 'tv';

  useEffect(() => {
    window.__kenshinMouseState = (on) => setMouseOn(!!on);
    try { setMouseOn(!!window.KenshinView?.isMouse?.()); } catch {}
    return () => { delete window.__kenshinMouseState; };
  }, []);

  const toggleMouse = () => {
    if (window.KenshinView) window.KenshinView.toggleMouse();
    else setMouseOn(v => !v);
  };

  const send = useCallback((msg) => {
    try { iframeRef.current?.contentWindow?.postMessage(msg, EH); } catch {}
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = playerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el)?.catch?.(()=>{});
    }
  }, []);

  // Parent-owned fullscreen handshake with VidRift (fs=parent)
  useEffect(() => {
    const onFsChange = () => {
      send({ type: 'vidrift:fullscreen-state', on: !!document.fullscreenElement });
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, [send]);

  useEffect(() => {
    const handler = (e) => {
      if (e?.data?.type === 'vidrift:fullscreen') {
        const el = playerRef.current;
        const want = !!e.data.on;
        if (want && !document.fullscreenElement) (el?.requestFullscreen || el?.webkitRequestFullscreen)?.call(el);
        if (!want && document.fullscreenElement) document.exitFullscreen?.();
        setTimeout(() => send({ type: 'vidrift:fullscreen-state', on: !!document.fullscreenElement }), 100);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [send]);

  useEffect(() => {
    (async () => {
      try {
        const media = isTv ? 'tv' : 'movie';
        const d = await tmdb(`/${media}/${id}`);
        setTitle(d.title || d.name || '');
      } catch {}
    })();
  }, [id, isTv]);

  useEffect(() => {
    const n = isTv ? 'tv' : 'movie';
    const titleQ = title ? `&title=${encodeURIComponent(title)}` : '';
    let url;
    if (isTv) url = `${EH}/embed/tv/${id}/${season}/${episode}?uiScale=1.5&exit=1&showTitle=1&mobileSheets=true&fs=parent${titleQ}`;
    else url = `${EH}/embed/movie/${id}?uiScale=1.5&exit=1&showTitle=1&mobileSheets=true&fs=parent${titleQ}`;
    setSrc(url);
  }, [id, title, season, episode, isTv]);

  useEffect(() => {
    const handler = (e) => {
      const t = e?.data?.type;
      if (!t) return;
      if (t === 'vidrift:exit') navigate(`/${isTv ? 'tv' : 'movie'}/${id}`);
      if (isTv && t === 'vidrift:episode') {
        const s = e.data?.season || season, ep = e.data?.episode || episode;
        if (s !== season || ep !== episode) navigate(`/tv/${id}/watch?season=${s}&episode=${ep}`, { replace: true });
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [isTv, id, season, episode, navigate]);

  useEffect(() => {
    const el = iframeRef.current;
    if (!el) return;
    const handleLoad = () => { el.tabIndex = -1; try { el.blur(); } catch {} };
    el.addEventListener('load', handleLoad);
    el.tabIndex = -1;
    // Prevent the iframe from permanently taking over remote (D-pad) focus.
    const blurIframe = () => {
      try { el.blur(); } catch {}
      const anchor = document.querySelector('.back-btn');
      if (anchor && document.activeElement !== anchor) { try { anchor.focus({ preventScroll: true }); } catch {} }
    };
    const focusGuard = (ev) => {
      if (ev?.target === el || el.contains?.(ev?.target)) {
        blurIframe();
      }
    };
    const clickGuard = () => { setTimeout(blurIframe, 0); };
    el.addEventListener('click', clickGuard);
    el.addEventListener('touchend', clickGuard);
    // keep iframe out of the tab order and avoid long-press actions
    try { el.setAttribute('tabindex', '-1'); } catch {}
    document.addEventListener('focusin', focusGuard, true);
    return () => {
      el.removeEventListener('load', handleLoad);
      el.removeEventListener('click', clickGuard);
      el.removeEventListener('touchend', clickGuard);
      document.removeEventListener('focusin', focusGuard, true);
    };
  }, []);

  const prevEp = episode > 1 ? episode - 1 : null;
  const nextEp = episode + 1;

  return (
    <div className="watch-page">
      <div ref={playerRef} className="player-box">
        {src ? (
          <iframe ref={iframeRef} src={src} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="no-referrer" />
        ) : (
          <div className="empty" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No source available.</div>
        )}
      </div>

      <div className="controls-bar">
        <Link to={`/${isTv ? 'tv' : 'movie'}/${id}`} className="back-btn">← Back</Link>
        <span className="now-playing">{title} {isTv ? `S${season} E${episode}` : ''}</span>

        <div className="controls-bar-actions">
          {isTv && prevEp && <Link to={`/tv/${id}/watch?season=${season}&episode=${prevEp}`}><button>Prev</button></Link>}
          {isTv && <Link to={`/tv/${id}/watch?season=${season}&episode=${nextEp}`}><button>Next</button></Link>}
          <button onClick={toggleFullscreen} className="fs-btn">Fullscreen</button>>
          <button className={mouseOn ? 'mouse-btn active' : 'mouse-btn'} onClick={toggleMouse}>
            {mouseOn ? 'Mouse: On' : 'Mouse: Off'}
          </button>
        </div>
      </div>

      {mouseOn && <div className="mouse-hint">Mouse on — D-pad moves cursor; OK/Enter press to drag/scroll (press again to release); Back turns off</div>}
    </div>
  );
}