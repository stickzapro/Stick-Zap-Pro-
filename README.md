# StickZap Creator Studio — Netlify Local-First Edition

This is a new, independent project. It does not replace or delete the previous GitHub repository.

## Features that work without API keys
- Responsive dashboard and navigation
- Local story outline generation
- Editable/reorderable scenes
- Local Viral Radar idea brainstorming (not live trend analytics)
- Video production brief export (does not render video)
- Frame upload previews and transition-plan export (does not render video)
- Narration script preparation and export (does not synthesize audio)
- Local project library, import/export, and deletion
- Safe localStorage error handling and validation

## Deploy to Netlify
1. Download and unzip this folder.
2. Create a new folder/repository for this new app, or upload the files into a new Replit project and connect that project to a new GitHub repository.
3. In Netlify, choose **Add new site → Import an existing project** and connect the new repository.
4. Build command: leave blank.
5. Publish directory: `.` (the project root).
6. Deploy the site.
7. Open the deployed URL and test the checklist below.

If Netlify account credits are exhausted, a new site on the same account may still be blocked by the account's usage limit. Wait for the reset or use another compatible host. Do not create repeated sites to bypass limits.

## Optional health function
After deploying with Netlify Functions enabled, visit `/.netlify/functions/health`. It should return JSON with `"ok": true`. This endpoint contains no secrets and does not configure any AI provider.

## Important limitations
This edition is intentionally local-first. It does not yet connect Gemini, image generation, video rendering, audio synthesis, or social-media publishing. Those require separate provider integrations, current API/model verification, server-side secrets, and often have quotas or paid costs. The interface states these limitations rather than faking successful generation.

## Test checklist
- Dashboard loads and navigation switches sections.
- Story Lab generates a local outline with no API key.
- Scenes can be edited, reordered, and deleted.
- Save and reopen a project.
- Export a text outline and JSON project backup.
- Viral Radar generates local concepts.
- Direct Video creates and exports a brief, not a video.
- Frame-to-frame previews valid images under 8 MB and creates a plan.
- Audio Studio prepares and exports a script, not audio.
- Search, import, export, and delete projects in the library.
- Test on an Android-sized viewport.
- Check browser console for errors.
