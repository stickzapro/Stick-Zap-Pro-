# StickZap Creator Studio — Netlify deploy package

A mobile-friendly, local-first creator planning app with Story Lab, Viral Radar, Direct Video briefs, Frame-to-frame planning, Audio script planning, and a local Project Library.

## What's included
- Facebook Reels and Facebook Video options in Viral Radar
- Copy idea button for generated concepts
- Progressive Web App manifest, install prompt guidance, service worker, and 192px/512px icons
- Netlify configuration and a simple health-check function
- Static HTML/CSS/JavaScript; no paid API key required for planning tools

## Deploy to Netlify
1. Upload the **contents** of this folder to the root of your GitHub repository. `index.html` must be at the repository root.
2. Confirm `netlify/functions/health.mjs` is inside the `netlify/functions` folder.
3. In Netlify, import the GitHub repository and deploy the `main` branch.
4. The included `netlify.toml` sets publish directory to `.` and functions directory to `netlify/functions`.
5. Open the HTTPS site in Chrome on Android. Use **Install app** in the app header, or Chrome menu (⋮) → **Install app** / **Add to Home screen**.

## Notes and limitations
- Viral Radar ideas are generated locally and are **not live Facebook trend data**.
- Facebook posting/publishing is not connected; this app does not request Facebook login or publish on your behalf.
- Video rendering, audio synthesis, and cloud AI generation are not connected in this edition.
- The service worker caches the app shell for offline fallback. Projects remain in the current browser's local storage on that device.
- To receive updates after deploying a new version, refresh the site; if needed, close and reopen the installed app.
