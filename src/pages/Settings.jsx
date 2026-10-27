import React, { useState } from 'react';

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

export default function Settings() {
  const [settings, setSettings] = useState({
    autoplayNext: true,
    quality: 'Auto',
    trailerAutoplay: false,
    cardPreviews: true,
    skipIntros: false,
    showContinueWatching: true,
    watchHistory: true,
    recentSearches: true,
  });

  const toggle = (key) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  const setVal = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Customize your viewing experience</p>
      </div>

      <SettingSection title="Playback">
        <SettingItem 
          label="Autoplay next episode" 
          description="Start the next episode only after the current episode finishes."
        >
          <input type="checkbox" checked={settings.autoplayNext} onChange={() => toggle('autoplayNext')} />
        </SettingItem>

        <SettingItem 
          label="Quality" 
          description="Auto adapts to your connection."
        >
          <select value={settings.quality} onChange={e => setVal('quality', e.target.value)} className="control-select">
            <option value="Auto">Auto</option>
            <option value="1080p">1080p</option>
            <option value="720p">720p</option>
            <option value="480p">480p</option>
          </select>
        </SettingItem>

        <SettingItem 
          label="Title page trailer" 
          description="Autoplay the trailer at the top of movie and show pages."
        >
          <input type="checkbox" checked={settings.trailerAutoplay} onChange={() => toggle('trailerAutoplay')} />
        </SettingItem>

        <SettingItem 
          label="Card previews" 
          description="Play a trailer when you hover a card on desktop."
        >
          <input type="checkbox" checked={settings.cardPreviews} onChange={() => toggle('cardPreviews')} />
        </SettingItem>

        <SettingItem 
          label="Skip intros" 
          description="Jump past intros and recaps automatically."
        >
          <input type="checkbox" checked={settings.skipIntros} onChange={() => toggle('skipIntros')} />
        </SettingItem>
      </SettingSection>

      <SettingSection title="Appearance">
        <SettingItem 
          label="Continue watching" 
          description="Show in-progress titles at the top of the home page."
        >
          <input type="checkbox" checked={settings.showContinueWatching} onChange={() => toggle('showContinueWatching')} />
        </SettingItem>
      </SettingSection>

      <SettingSection title="Privacy">
        <SettingItem 
          label="Watch history" 
          description="Save what you watch so you can pick up where you left off."
        >
          <input type="checkbox" checked={settings.watchHistory} onChange={() => toggle('watchHistory')} />
        </SettingItem>

        <SettingItem 
          label="Recent searches" 
          description="Keep your last few searches in the search panel."
        >
          <input type="checkbox" checked={settings.recentSearches} onChange={() => toggle('recentSearches')} />
        </SettingItem>
      </SettingSection>
    </div>
  );
}
