# KenshinView

A multi-device (Android TV + mobile) replica of 7Movies (https://7movies.ac/).

## Features
- Home rails, Movies, TV, Discover with filters, Search, Detail, Watch
- Uses the same backend API (proxied) for catalog, discover, search, TMDB, playback tokens, progress, watchlist
- Multiple streaming sources (Direct/Earth + external providers)
- TV-remote friendly: spatial D-pad navigation, large focus outlines
- Responsive for mobile
- PWA manifest for installability
- Android WebView wrapper in `/android` (open the bundled web app)

## Run (web)
```
npm install
npm run dev     # http://localhost:5173
npm run build
npm run start   # serves dist on :3000 with API proxy
```

## Android TV
Open `/android` in Android Studio, build & run. The app loads the bundled web UI and calls the upstream API directly.

## Notes
- All content is sourced from third-party providers via the upstream site. This project is for educational/personal use.