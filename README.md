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


## Story Lab: real AI video generation (optional)

Story Lab now includes a direct **Generate Video from Story** workflow using Google's Veo 3.1 API through Netlify Functions. The API key is read only on the server; it is not embedded in frontend JavaScript.

1. In Google AI Studio, create an API key with access to the Gemini API and confirm Veo access and billing/usage terms for your account. Video generation may incur charges and the model can be preview/region restricted.
2. In Netlify open **Site configuration → Environment variables** and add `GEMINI_API_KEY` with that key as the value. Never put the key in `app.js`, HTML, or a public GitHub file.
3. Redeploy the site so the function receives the environment variable.
4. Open Story Lab, enter a story or generate a local outline, choose style/aspect ratio/duration/quality, then click **Generate Video from Story**. Jobs run asynchronously and the page polls for completion.

Veo currently supports 4-, 6-, or 8-second clips and 9:16 or 16:9 output in this integration. 1080p/4K require 8 seconds; 4K availability and pricing depend on the model/account. Style names guide the prompt but do not guarantee exact art direction.

### Video link to story limitations

- YouTube and TikTok public metadata may provide a title, but this integration does not bypass login, access controls, DRM, or platform restrictions and does not promise transcript extraction. Facebook/Instagram links may not expose metadata.
- Paste captions/transcript into the Story Lab transcript field to create a local outline. A selected video file is not uploaded or analyzed in this edition; the interface explains this rather than pretending to process it.
- Provider-hosted output URLs are temporary. Download generated videos promptly. Downloading is proxied through a Netlify Function and depends on the provider supporting byte-range requests and Netlify function limits. For production-scale large video downloads, configure durable object storage and a streaming download endpoint.

Other existing tools remain local-first. Viral Radar ideas are not live trend data; Facebook posting, audio synthesis, and general-purpose AI story writing are not connected by this upgrade.
