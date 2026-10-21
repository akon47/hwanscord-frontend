🌏 [한국어](./README-ko.md)

# HWANSCORD — Frontend

A Discord-like chat app for a small group of friends: text channels, direct messages, voice channels and screen sharing.
This repository is the web client (Vue 3). The API lives in [hwanscord-backend](https://github.com/akon47/hwanscord-backend).

**Live:** https://hwanscord.kimhwan.kr/

## Features

- **Chat** — message grouping, date and "new messages" dividers, infinite scroll, jump to bottom, replies, reactions,
  inline edit (↑ edits your last message), delete with preview, pins, full-text search.
- **Formatting** — safe markdown subset: bold, italic, underline, strike, inline code, code blocks, spoilers, quotes,
  auto-links, `@mentions` and `@everyone`, jumbo emoji.
- **Composer** — mention and `:emoji:` autocomplete, emoji picker with recents, attachments by button, drag & drop or
  paste with upload progress, optimistic send with retry, drafts per channel, typing indicator.
- **Media** — inline images (lightbox), video and audio players, file cards.
- **Presence** — online / idle / do-not-disturb / invisible, custom status, member list, profile popovers.
- **Unread tracking** — per-channel unread and mention badges, tab title count, optional sounds and desktop notifications.
- **Direct messages** — one-to-one DM channels from the home screen, member list or a profile.
- **Voice** — mesh WebRTC voice with speaking indicators, mute / deafen, per-user volume (0–200 %), device selection,
  echo cancellation / noise suppression toggles, join/leave tones.
- **Screen share** — share a screen or window into a voice channel; others click *Watch* to view it.
  TURN relay credentials come from Cloudflare Realtime via the backend, with a monthly budget guard so it stays in the free tier.
- **Settings** — account (avatar, display name, about me, password), status, voice, notifications, appearance
  (dark / light theme, compact mode, font size) and an admin page with TURN usage.
- Responsive layout with a bottom tab bar on phones.

## Stack

Vue 3.5 (`<script setup>`, TypeScript strict) · Vite 6 · Pinia · Vue Router 4 · socket.io-client 4 · Lucide icons ·
hand-written CSS with design tokens · Web Audio for sounds · Vitest + Vue Test Utils.

## Development

Requires Node.js 22.

```sh
npm install
npm run dev          # http://localhost:5173 — proxies /api, /socket.io, /uploads, /healthz to http://localhost:8080
```

Run the backend on port 8080 next to it (see the backend README; `SEED=1 npm run dev:mem` starts it with an in-memory
MongoDB and demo users). Set `VITE_DEV_BACKEND` to point the proxy somewhere else.

```sh
npm run lint         # eslint (flat config)
npm run typecheck    # vue-tsc
npm test -- --run    # vitest
npm run build        # production build into dist/
```

## Project layout

```
src/
  api/          typed REST client (mirrors the backend docs/API.md contract)
  realtime/     socket.io connection, event handlers, session lifecycle
  rtc/          WebRTC: peers, voice mesh, screen share, audio graph, devices, ICE servers
  stores/       Pinia stores (auth, users, channels, messages, readStates, voice, ui, settings)
  components/   layout, channels, chat, voice, users, settings, common
  composables/  reusable logic (context menus, infinite scroll, auto-resize, uploads, ...)
  utils/        markdown renderer, time formatting, mentions, emoji data, sounds, notifications
  views/        login, register, workspace, home, 404
docs/DESIGN.md  feature and design spec
```

## Deployment

```
git push (master) → Jenkins (build.kimhwan.kr, job hwanscord-frontend)
  → docker build --target test     (lint + typecheck + tests)
  → docker build --target runtime  (nginx image with the built SPA)
  → Docker Hub akon47/hwanscord-frontend:<build>
  → ssh deploy@10.10.10.75: copy deploy/ to /srv/hwanscord/frontend, run deploy.sh (compose pull + up)
  → smoke test: web 200, version.txt == build number, /healthz through the proxy
```

The container's nginx serves the SPA and proxies `/api/`, `/socket.io/` (WebSocket), `/uploads/` and `/healthz` to
`hwanscord-api:8080` on the shared `hwanscord` Docker network, so the browser only talks to one origin.
TLS is terminated by the home-lab nginx gateway in front of it. The image contains no secrets.

## License

MIT
