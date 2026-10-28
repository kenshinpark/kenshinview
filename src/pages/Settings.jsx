import React, { useState, useEffect } from 'react';
import { load, loadSettings, saveSettings } from '../api.js';

const SettingItem = ({ label, description, children }) => (
  <div className="settings-item">
    <div className="settings-info">
      <span className="settings-label">{label}</span>
      {description && <span className="settings-desc">{description}</span>}
    </div>
    <div className="settings-control">
      {children}
    </div>
  </div>
);

const SettingSection = ({ title, children }) => (
  <div className="settings-section">
    <h2>{title}</h2>
    <div className="settings-list">
      {children}
    </div>
  </div>
);

const ACTION_STYLE = { background: 'transparent', border: '1px solid rgba(255,255,255,0.18)', color: 'var(--muted)', padding: '8px 14px', borderRadius: 12, cursor: 'pointer' };

export default function Settings() {
  const [settings, setSettings] = useState(loadSettings);

  useEffect(() => { saveSettings(settings); }, [settings]);

  const toggle = (key) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));

  const clearWatchHistory = () => { try { localStorage.removeItem('cinrift_watchHistory'); } catch {} window.dispatchEvent(new Event('cinrift:watchhistory')); };
  const clearSearchHistory = () => { try { localStorage.removeItem('cinrift_recentSearches'); } catch {} window.dispatchEvent(new Event('cinrift:searchhistory')); };

  const historyCount = (load('cinrift_watchHistory', []) || []).length;
  const searchCount = (load('cinrift_recentSearches', []) || []).length;

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Lightweight preferences. Everything is stored on this device only.</p>
      </div>

      <SettingSection title="Appearance">
        <SettingItem
          label="Continue watching"
          description="Show the titles you recently started on the Home page."
        >
          <input type="checkbox" checked={settings.showContinueWatching} onChange={() => toggle('showContinueWatching')} />
        </SettingItem>

        <SettingItem
          label="Hide unreleased"
          description="Hide movies and shows that haven't been released yet."
        >
          <input type="checkbox" checked={settings.hideUnreleased} onChange={() => toggle('hideUnreleased')} />
        </SettingItem>
      </SettingSection>

      <SettingSection title="Privacy">
        <SettingItem
          label="Watch history"
          description="Remember what you've played so you can resume quickly."
        >
          <input type="checkbox" checked={settings.watchHistory} onChange={() => toggle('watchHistory')} />
        </SettingItem>

        <SettingItem
          label="Recent searches"
          description="Keep your last searches available in search."
        >
          <input type="checkbox" checked={settings.recentSearches} onChange={() => toggle('recentSearches')} />
        </SettingItem>

        <SettingItem
          label="Clear watch history"
          description={`${historyCount} item${historyCount === 1 ? '' : 's'} stored.`}
        >
          <button style={ACTION_STYLE} onClick={clearWatchHistory} disabled={historyCount === 0}>Clear</button>
        </SettingItem>

        <SettingItem
          label="Clear recent searches"
          description={`${searchCount} quer${searchCount === 1 ? 'y' : 'ies'} stored.`}
        >
          <button style={ACTION_STYLE} onClick={clearSearchHistory} disabled={searchCount === 0}>Clear</button>
        </SettingItem>
      </SettingSection>
    </div>
  );
}
