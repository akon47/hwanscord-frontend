# HWANSCORD v2 — frontend design & feature spec

Discord-like single-community chat (text, voice, screen share) for a small group of friends. Korean UI text.
Backend contract: `C:\Users\hwank\src\hwanscord-backend\docs\API.md` (same-origin `/api/v1`, Socket.IO `/socket.io/`).

## Stack

- Vue 3.5 (`<script setup lang="ts">`), Vite 6, TypeScript strict, Pinia, Vue Router 4 (history mode), socket.io-client 4.
- Icons: `@lucide/vue` (import only the icons used). No FontAwesome, no v-tooltip, no vuex.
- No UI framework. Hand-written CSS with design tokens (CSS custom properties) in `src/styles/tokens.css`; component styles `scoped`.
- Fonts: Google Fonts `Inter` + `Noto Sans KR` (`<link>` in index.html), fallback `system-ui`.
- Sounds: synthesized with the Web Audio API (`src/utils/sounds.ts`) — no binary assets in the repo.
- Keep the Google Analytics tag (`G-0PDN7W40KS`) in `index.html`.
- Tests: Vitest for pure utils (`markdown.ts`, `time.ts`, `mentions.ts`). `npm run build` and `vue-tsc --noEmit` must pass.

## Routes

| path | view |
|---|---|
| `/login`, `/register` | auth pages (centered card, animated gradient background) |
| `/channels/@me` | Home: DM list in the sidebar, main area = member directory ("친구" style list of all users with status, click → open DM / profile) |
| `/channels/@me/:channelId` | DM conversation |
| `/channels/:channelId` | text channel (chat) or voice channel (voice view) |
| `*` | 404 |

Unauthenticated → redirect to `/login`. After login → last visited channel (localStorage) or `/channels/@me`.

## Layout (desktop ≥ 900px)

```
┌──────────────┬──────────────────────────────────────────┬──────────────┐
│ ChannelSide  │ ChannelHeader  (# name · topic · search · pins · members toggle)│ MemberList   │
│ bar 240px    ├──────────────────────────────────────────┤ 240px        │
│  HWANSCORD   │                                          │ 온라인 — n   │
│  ▸ 채팅 채널  │   MessageList (virtual-ish, grouped)      │  avatar name │
│   # general  │                                          │ 오프라인 — n │
│  ▸ 음성 채널  │                                          │              │
│   🔊 lounge  ├──────────────────────────────────────────┤              │
│     ◉ user   │ TypingIndicator                          │              │
│ ──────────── │ MessageInput (textarea, +, emoji, send)   │              │
│ VoicePanel   │                                          │              │
│ UserPanel    │                                          │              │
└──────────────┴──────────────────────────────────────────┴──────────────┘
```

- ChannelSidebar: header with app name + online count; collapsible categories "채팅 채널", "음성 채널", "다이렉트 메시지"; `+` buttons open CreateChannelModal; right-click channel → context menu (수정, 삭제, 읽음으로 표시, 링크 복사). Unread channels render in bright text with a left pill; mention badge (red count). Voice channels list their members underneath (avatar 24px, name, mute/deafen/LIVE icons, green speaking ring).
- VoicePanel (only while connected): green "음성 연결됨" + channel name, buttons: 화면 공유 / 연결 끊기, connection quality icon.
- UserPanel: my avatar + status dot, displayName, customStatus/username; buttons: 마이크 음소거, 헤드셋 음소거(deafen), 설정 ⚙. Click avatar → status picker (온라인/자리 비움/다른 용무 중/오프라인 표시 + 사용자 지정 상태).
- MemberList: grouped by presence (online first), each row avatar+status dot, displayName, customStatus; click → UserProfilePopover (avatar, display name, username, 소개, 가입일, "메시지 보내기" button); right-click → context menu (프로필, 메시지 보내기, 멘션).
- Mobile (< 900px): single column; bottom tab bar (채널 / 채팅 / 멤버); sidebar slides in; message input stays above the keyboard.

## Chat behaviour (parity with Discord)

- Message grouping: consecutive messages by the same author within 7 minutes collapse (no avatar/name; hover shows short time on the left).
- Date dividers ("2026년 10월 21일"), "새 메시지" divider at the first unread, "맨 아래로" jump button when scrolled up.
- Infinite scroll upward (`before` cursor, 50 per page, keep scroll position). Auto-scroll on new message only when at bottom.
- Hover toolbar on a message: 반응 추가, 답장, 수정(own), 더보기(⋯ → 메시지 고정/고정 해제, 링크 복사, 텍스트 복사, 삭제(own/admin)). Right-click context menu with the same items.
- Reply: reply bar above the input; rendered as a quote line above the message ("↳ @name content…", click scrolls to the original).
- Reactions: pills under the message (emoji + count, highlighted when mine), click toggles; tooltip lists who reacted; "+" opens the emoji picker.
- Edit inline: ArrowUp in an empty input edits my last message; Enter saves, Esc cancels. Edited messages show "(수정됨)".
- Delete asks for confirmation (ConfirmDialog) showing a preview of the message.
- Pins: header pin icon opens PinnedPopover listing pinned messages.
- Search: header search box; results panel on the right replaces MemberList ("검색 결과 n개"), click jumps to channel (and highlights the message if loaded).
- Markdown subset rendered by `utils/markdown.ts` (**safe**: escape HTML first, then tokenise): `**bold**`, `*italic*`/`_italic_`, `__underline__`, `~~strike~~`, `` `code` ``, fenced code blocks, `||spoiler||` (click to reveal), `> quote`, auto-link URLs (`https://…`, `target=_blank rel=noopener`), `<@userId>` → `@displayName` mention chip (highlight when it's me), `@everyone`, line breaks. Unit tests cover XSS attempts (`<img onerror>`, `javascript:` links).
- Mentions: typing `@` opens MentionPopup (fuzzy filter on display/user name, arrow keys + Enter/Tab), inserts `<@id>` into the stored content while the textarea shows `@displayName` (keep a mapping; simplest: store raw `<@id>` in the textarea and render it with a highlighted overlay, or convert on send — either is fine as long as the sent content uses `<@id>`).
- Emoji: `:` + 2 chars opens emoji autocomplete; `😀` button opens EmojiPicker (curated ~300 unicode emoji grouped: 스마일, 사람, 동물, 음식, 활동, 여행, 사물, 기호; search by Korean/English keywords; recently used in localStorage).
- Attachments: `+` button, drag-and-drop overlay over the chat ("파일을 여기에 놓으세요"), paste from clipboard. Previews as chips above the input with remove buttons and upload progress. Images render inline (max 400×300, click → ImageLightbox with zoom/download), videos inline `<video controls>`, audio `<audio controls>`, other files as a card (icon, name, size, download).
- Typing indicator: "<name>님이 입력 중...", "<a>님, <b>님이 입력 중...", "여러 명이 입력 중...". Emit `typing` every 3 s while typing.
- Unread/mention tracking: ReadStates from the API + live updates; ack when the channel is visible and scrolled to bottom (debounced). Document title shows `(n) HWANSCORD` for total mentions. Optional sounds + desktop `Notification` (when permission granted and the tab is hidden) for mentions and DMs; toggles in settings.
- Optimistic send: render the pending message immediately (dimmed) using `nonce`; replace on `message:create` with the same nonce; show retry on failure.
- Textarea: auto-grows to 50% of viewport, Enter sends, Shift+Enter newline, 2000 char counter near the limit, disabled when offline.
- Connection banner when the socket is disconnected ("연결이 끊어졌습니다. 다시 연결 중…"); on reconnect refetch channels/read-states/presences.

## Voice & screen share

- Click a voice channel → join (ask mic permission; if denied show toast and stay out). Joining plays a short rising tone, leaving a falling tone, someone else joining/leaving plays softer tones (settings toggle).
- `rtc/voiceClient.ts`: mesh per API.md rules; handles reconnection (recreate on `failed`), `getStats`-based quality indicator optional.
- Speaking detection: `AudioContext` + `AnalyserNode` per remote stream and for the local mic; green ring on avatars while speaking (threshold with 300 ms hangover). Deafen mutes all remote audio elements.
- Per-user volume slider in the voice member context menu (0–200%, via `GainNode` or element volume ≤ 1 plus gain for >100%).
- Voice channel main view (`VoiceChannelView`): grid of participant tiles (avatar, name, speaking ring, mute icon); a streaming participant's tile shows the live video; click a tile to focus (large) with the others in a strip; "화면 공유" / "공유 중지" button; "음성 채널 나가기".
- Screen share: `getDisplayMedia({ video: { frameRate: 30 }, audio: true })`; sharer tile gets a red "LIVE" badge in the sidebar; viewers click the tile (or "시청하기") → `screen:watch`. Stop when the user ends the share from the browser UI (`track.onended`).
- Settings → 음성: input device select (`enumerateDevices`, remember deviceId), input level meter, output volume, toggles for echoCancellation / noiseSuppression / autoGainControl, test mic button.

## Settings modal (full-screen like Discord, Esc closes)

Tabs: 내 계정 (avatar upload/remove with crop-less preview, display name, username (read-only), 소개, 비밀번호 변경), 프로필 상태 (status + custom status), 음성 및 비디오, 알림 (sounds, desktop notifications), 모양 (테마 다크/라이트, 메시지 표시 간격 compact/cozy, 글꼴 크기), 관리 (admin only: TURN usage from `/rtc/usage`, channel list management). Settings persist via `PATCH /users/me { settings }` and mirror to localStorage.

## Visual language

Dark theme (default) tokens — follow Discord's current palette feel but keep it ours:

```
--bg-tertiary:#1e1f22  --bg-secondary:#2b2d31  --bg-primary:#313338  --bg-floating:#111214  --bg-modifier-hover:rgba(78,80,88,.3)
--bg-modifier-selected:rgba(78,80,88,.6)  --text-normal:#dbdee1  --text-muted:#949ba4  --header-primary:#f2f3f5  --header-secondary:#b5bac1
--brand:#5865f2  --brand-hover:#4752c4  --green:#23a559  --yellow:#f0b232  --red:#f23f43  --link:#00a8fc  --mention-bg:rgba(88,101,242,.3)
--radius-sm:4px --radius-md:8px --radius-lg:12px  --sidebar-w:240px  --font-sans:"Inter","Noto Sans KR",system-ui,sans-serif
```

Light theme redefines the same tokens under `html[data-theme="light"]` (`--bg-primary:#ffffff --bg-secondary:#f2f3f5 --bg-tertiary:#e3e5e8 --text-normal:#313338 …`).
Everything uses tokens; no hard-coded colors in components. Scrollbars thin and themed. Focus rings visible (`:focus-visible`). Transitions 120–200 ms. Avatars round with a status dot (online green, idle yellow crescent, dnd red bar, offline grey) masked like Discord. Default avatar = colored circle from a hash of the id with the first letter of the display name.

## Non-functional

- Everything typed (`src/api/types.ts` mirrors API.md). Central `api/client.ts` adds the token, maps error bodies to `ApiError { status, code, message }`, redirects to `/login` on 401.
- Stores: `auth` (token/user), `users` (map + presence), `channels` (list, DM helpers, selected), `messages` (per-channel ordered arrays + cursors + pending), `readStates`, `voice` (state map, my voice session), `ui` (modals, member list visibility, mobile tab, toasts), `settings` (theme, sounds, devices; persisted).
- `realtime/socket.ts` creates the singleton socket and `realtime/handlers.ts` maps every server event in API.md to store mutations.
- Accessibility: buttons have `aria-label`s, modals trap focus, color contrast ≥ 4.5:1 for text.
- Build output served by nginx in the Docker image; nginx also proxies `/api/`, `/socket.io/` (WebSocket upgrade), `/uploads/`, `/healthz` to the backend service `hwanscord-api:8080` (`client_max_body_size 30m`). `index.html` fallback for SPA routes.
