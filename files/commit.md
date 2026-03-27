# 🪐 Orbit — 31-Day Commit Roadmap

> Each entry is a single day's work, formatted as a git commit message with a breakdown of exactly what changes to make.

---

## Week 1 — Foundation & Auth (Days 1–7)

**Goal: Django backend running, JWT auth working, Docker up**

---

### Day 1

```
feat: init django project with base/dev/prod settings split
```

**Changes:**

- Create Django project structure under `backend/core/`
- Write `core/settings/base.py` — shared settings (DB, installed apps, DRF, JWT, Cloudinary, Channels)
- Write `core/settings/dev.py` — imports base, sets `DEBUG=True`, `CORS_ALLOWED_ORIGINS`, console email backend
- Write `core/settings/prod.py` — imports base, locks down `DEBUG`, `ALLOWED_HOSTS`, security headers
- Install: `django`, `djangorestframework`, `channels[daphne]`, `channels-redis`, `djangorestframework-simplejwt`, `django-cors-headers`, `cloudinary`, `django-cloudinary-storage`, `psycopg2-binary`, `python-decouple`
- Write `requirements.txt`
- Write `manage.py` pointing to `core.settings.dev`
- Write `core/asgi.py` (placeholder — full WebSocket config comes on Day 15)

---

### Day 2

```
feat: add postgresql + redis + docker compose stack
```

**Changes:**

- Write `docker-compose.yml` with 4 services: `postgres`, `redis`, `django`, `frontend`
- Add healthchecks for postgres (`pg_isready`) and redis (`redis-cli ping`)
- Add named volume `postgres_data` for persistence
- Write `backend/Dockerfile` — python:3.11-slim, install deps, run Daphne
- Write `frontend/Dockerfile` — node:20-alpine, npm install, run Vite dev server
- Write `.env.example` with all required keys
- Write `.gitignore` (never commit `.env`)
- Verify `docker compose up --build` starts all 4 services cleanly

---

### Day 3

```
feat: add custom user model with cloudinary avatar
```

**Changes:**

- Create `apps/accounts/` with `__init__.py`, `apps.py`, `models.py`, `migrations/`
- Write `CustomUser(AbstractUser)` with: `avatar` (CloudinaryField), `bio` (TextField), `is_online` (BooleanField), `last_seen` (DateTimeField auto_now)
- Add `__str__` returning `self.username`
- Set `AUTH_USER_MODEL = 'accounts.CustomUser'` in `base.py`
- Register `apps.accounts` in `INSTALLED_APPS`
- Run `makemigrations accounts` and `migrate`
- Verify user creation works in Django admin

---

### Day 4

```
feat: add jwt auth endpoints (register, login, refresh, profile)
```

**Changes:**

- Write `accounts/serializers.py`:
  - `RegisterSerializer` — validates password match, calls `create_user`
  - `UserProfileSerializer` — explicit fields, `read_only_fields` for id/is_online/last_seen
- Write `accounts/views.py`:
  - `RegisterView(CreateAPIView)` — `AllowAny`
  - `ProfileView(APIView)` — GET and PATCH, `IsAuthenticated`
- Write `accounts/urls.py` — wire `register/`, `token/`, `token/refresh/`, `profile/`
- Include `accounts.urls` in `core/urls.py` at `api/auth/`
- Restart container, test all 4 endpoints with curl

---

### Day 5

```
feat(day 5): init react+vite frontend with tailwind, axios, zustand, react-router
```

**Changes:**

- Install frontend deps: `react-router-dom`, `axios`, `zustand`, `tailwindcss`
- Configure `tailwind.config.js` — content paths, `darkMode: 'class'`
- Update `src/index.css` with `@tailwind base/components/utilities`
- Create folder structure:
  - `src/api/` — `axiosInstance.js` with base URL from `import.meta.env.VITE_API_URL`
  - `src/components/` — empty, ready for Week 2
  - `src/hooks/` — empty
  - `src/pages/` — empty
  - `src/store/` — `useAuthStore.js` scaffold (user, tokens, isAuthenticated, setAuth, logout)
  - `src/utils/` — `formatDate.js` (relative time helper)
- Replace default `App.jsx` with React Router `<Routes>` shell
- Add `dark` class to `<html>` in `index.html` for default dark mode

---

### Day 6

```
feat(day 6): add login and register pages connected to backend auth api
```

**Changes:**

- Write `src/pages/Register.jsx` — form with username, email, password, password2
- Write `src/pages/Login.jsx` — form with username and password
- Create `src/api/auth.js` — `registerUser(data)` and `loginUser(data)` functions using axiosInstance
- On successful login: store `access` + `refresh` tokens in `useAuthStore`
- Add routes in `App.jsx`: `/login` → `Login.jsx`, `/register` → `Register.jsx`
- Add basic error display (show API error messages under form fields)
- Style with Tailwind dark palette (gray-900 bg, gray-800 form card, indigo-500 button)

---

### Day 7

```
feat(day 7): add jwt persistence, axios interceptors, and protected routes
```

**Changes:**

- On app load (`App.jsx useEffect`), check localStorage for stored tokens and rehydrate `useAuthStore`
- Write axios **request interceptor** in `axiosInstance.js` — inject `Authorization: Bearer <access>` on every request
- Write axios **response interceptor** — on 401, call `POST /api/auth/token/refresh/`, retry original request; on refresh failure, logout and redirect to `/login`
- Write `src/components/ProtectedRoute.jsx` — redirects to `/login` if not authenticated
- Wrap `/app/*` routes in `ProtectedRoute` in `App.jsx`
- Test: refresh page stays logged in, expired token auto-refreshes, invalid token logs out

---

## Week 2 — Servers & Channels (Days 8–14)

**Goal: Discord-like server/channel structure in place**

---

### Day 8

```
feat(day 8): add server model with invite code and membership
```

**Changes:**

- Create `apps/servers/` with `__init__.py`, `apps.py`, `models.py`, `migrations/`
- Write `Server` model: `name`, `icon` (CloudinaryField), `owner` (FK to CustomUser), `members` (M2M to CustomUser), `invite_code` (UUIDField default=uuid4, unique=True), `created_at` (auto_now_add)
- Add `__str__` returning `self.name`
- Register `apps.servers` in `INSTALLED_APPS`
- Run `makemigrations servers` and `migrate`

---

### Day 9

```
feat(day 9): add server crud endpoints (create, list, join, leave)
```

**Changes:**

- Write `servers/serializers.py` — `ServerSerializer` with explicit fields (no `__all__`), nested owner info
- Write `servers/views.py`:
  - `ServerListCreateView` — list only servers user is a member of; create adds owner as first member
  - `ServerJoinView` — accept `invite_code`, add user to `members`
  - `ServerLeaveView` — remove user from `members`; owner cannot leave (must delete)
- All views use `IsAuthenticated` permission class
- Write `servers/urls.py`, include in `core/urls.py` at `api/servers/`

---

### Day 10

```
feat(day 10): add channel model and crud endpoints
```

**Changes:**

- Write `Channel` model in `channels_chat/models.py`: `name`, `server` (FK to Server), `channel_type` (choices: text/announcement), `created_at`
- Add `__str__` returning `self.name`
- Write `channels_chat/serializers.py` — `ChannelSerializer` explicit fields
- Write `channels_chat/views.py`:
  - `ChannelListCreateView` — only server members can list/create channels
  - `ChannelDeleteView` — only server owner can delete a channel
- Write `channels_chat/urls.py`, include in `core/urls.py` at `api/channels/`
- Run `makemigrations channels_chat` and `migrate`

---

### Day 11

```
feat(day 11): build 3-panel discord-like layout shell
```

**Changes:**

- Write `src/components/layout/Sidebar.jsx` — vertical server icon list (left panel, gray-900 bg)
- Write `src/components/layout/ChannelList.jsx` — channel list for selected server (gray-800 bg)
- Write `src/components/chat/ChatWindow.jsx` — placeholder message area (gray-700 bg)
- Compose all three into `src/pages/ChatPage.jsx` with CSS grid/flex layout
- Add `ChatPage` to `App.jsx` under protected route `/app`
- Apply Discord-like dark Tailwind palette throughout

---

### Day 12

```
feat(day 12): wire server and channel data to frontend state
```

**Changes:**

- Write `src/api/servers.js` — `listServers()`, `createServer(data)`, `joinServer(invite_code)`, `listChannels(serverId)`
- Add to `useChatStore`: `servers`, `activeServer`, `channels`, `activeChannel`, `setActiveServer`, `setActiveChannel`, `setServers`, `setChannels`
- On login/app load: fetch servers, populate store
- `Sidebar.jsx` renders real server icons from store; clicking sets `activeServer`
- `ChannelList.jsx` fetches and renders channels when `activeServer` changes

---

### Day 13

```
feat(day 13): add create server modal and join by invite code
```

**Changes:**

- Write `src/components/server/CreateServerModal.jsx` — name input + optional icon upload, calls `createServer`
- Write `src/components/server/JoinServerModal.jsx` — invite code input, calls `joinServer`
- Add "+" button to `Sidebar.jsx` that opens `CreateServerModal`
- Add "Join" button that opens `JoinServerModal`
- On success: add new server to store, set as `activeServer`
- Show invite code in server settings (copy to clipboard button)

---

### Day 14

```
feat(day 14): add members list panel and server settings page
```

**Changes:**

- Write `src/components/layout/MemberList.jsx` — right panel showing server members with online/offline placeholder dots
- Write `src/pages/ServerSettings.jsx` — rename server (owner only), delete server (owner only), leave server (non-owner)
- Add gear icon to `ChannelList.jsx` header linking to `ServerSettings`
- Wire delete/leave actions to backend API endpoints
- On delete: remove server from store, redirect to home

---

## Week 3 — Real-Time WebSockets (Days 15–21)

**Goal: Messages flying in real-time**

---

### Day 15

```
feat(day 15): configure asgi, django channels routing and redis channel layer
```

**Changes:**

- Rewrite `core/asgi.py` with `ProtocolTypeRouter`:
  - `http` → `get_asgi_application()`
  - `websocket` → `AuthMiddlewareStack(URLRouter(websocket_urlpatterns))`
- Write full `channels_chat/routing.py` — `ws/chat/<channel_id>/`
- Confirm `CHANNEL_LAYERS` Redis config in `base.py`
- Confirm `ASGI_APPLICATION = 'core.asgi.application'` in `base.py`
- Flesh out `ChatConsumer` stub — accept connection, immediately close (smoke test)
- Test WebSocket handshake with `wscat` or browser devtools

---

### Day 16

```
feat(day 16): implement chat consumer (connect, auth, receive, broadcast)
```

**Changes:**

- Rewrite `ChatConsumer` in `channels_chat/consumers.py`:
  - `connect()` — check `self.scope['user'].is_anonymous`, close if true; `group_add`, `accept`
  - `disconnect()` — `group_discard`
  - `receive(text_data)` — parse JSON with `try/except`, validate not empty, broadcast to group
  - `chat_message(event)` — `self.send(text_data=json.dumps(event['message']))`
- Group name format: `chat_<channel_id>` (never use `channel_name`)
- Test: two browser tabs connect to same channel, message appears in both

---

### Day 17

```
feat(day 17): add message model and persist messages in consumer
```

**Changes:**

- Write `Message` model in `messages/models.py`: `channel` (FK), `sender` (FK to CustomUser), `content` (TextField blank=True), `file_url` (URLField), `file_name`, `file_type`, `is_edited` (BooleanField), `created_at` (auto_now_add), `updated_at` (auto_now)
- Add `__str__`
- Register `apps.messages` (with `label = 'chat_messages'` to avoid Django messages conflict)
- Run `makemigrations messages` and `migrate`
- Update `ChatConsumer.receive()` — use `database_sync_to_async` to save `Message` to DB before broadcasting
- Broadcast payload includes: `id`, `content`, `sender` (username + id), `timestamp`, `file_url`

---

### Day 18

```
feat(day 18): add message history rest endpoint with pagination
```

**Changes:**

- Write `MessageSerializer` in `messages/serializers.py` — explicit fields, nested sender (`id`, `username`, `avatar`)
- Write `MessageListView` in `messages/views.py`:
  - Filter by `?channel=<id>`, validate user is a member of that channel's server
  - `select_related('sender')` to avoid N+1
  - Return last 50 messages (newest-first queryset, reversed for display)
- Write `messages/urls.py`, include at `api/messages/`
- Test: fetch history returns correct messages in correct order

---

### Day 19

```
feat(day 19): add useWebSocket hook with reconnect and jwt auth
```

**Changes:**

- Write `src/hooks/useWebSocket.js`:
  - Connects to `ws://.../ws/chat/<channelId>/?token=<accessToken>`
  - Exposes `sendMessage(data)` function
  - Exposes `lastMessage` state (latest parsed message object)
  - On `onclose`: exponential backoff reconnect (delays: 1s, 2s, 4s, 8s, 16s — max 5 retries)
  - Cleanup: `ws.close()` in `useEffect` return
- Use `useCallback` for message handler to prevent stale closures

---

### Day 20

```
feat(day 20): render message history and live messages in chat window
```

**Changes:**

- `ChatWindow.jsx`: on channel select, fetch history from `GET /api/messages/?channel=<id>`, load into `useChatStore`
- Subscribe to `useWebSocket` — incoming messages appended to store in real time
- Write `src/components/chat/MessageBubble.jsx` — avatar, username, timestamp, content
- Use `useRef` to track scroll position; auto-scroll to bottom on new message only if user is already at bottom
- Format timestamps with `src/utils/formatDate.js` ("2 minutes ago")
- Show loading spinner while fetching history

---

### Day 21

```
feat: add typing indicators via websocket events
```

**Changes:**

- `MessageInput.jsx`: on keypress, send `{type: "typing", is_typing: true}` over WebSocket
- Debounce: use `setTimeout` to send `{is_typing: false}` 2 seconds after last keypress, clear on each new keypress
- `ChatConsumer.receive()`: handle `type == "typing"`, broadcast `{type: "typing", user_id, username, is_typing}` to group
- Frontend: track `typingUsers` map in `useChatStore`; update on incoming typing events
- Render "Sunil is typing..." below `MessageInput.jsx` (hide if `typingUsers` is empty)

---

## Week 4 — Files, Polish & Deploy (Days 22–31)

**Goal: File sharing, UI polish, and live on the internet**

---

### Day 22

```
feat: configure cloudinary storage and verify avatar upload
```

**Changes:**

- Confirm `CLOUDINARY_STORAGE` config reads from `.env` in `base.py`
- Confirm `DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'`
- Test avatar upload via `PATCH /api/auth/profile/` with a real Cloudinary account
- Verify returned URL is a valid `res.cloudinary.com` HTTPS link

---

### Day 23

```
feat: add file upload rest endpoint with type and size validation
```

**Changes:**

- Write `FileUploadView` in `messages/views.py`:
  - Accept `multipart/form-data` POST
  - Validate file type: only `jpg`, `png`, `gif`, `webp`, `pdf`, `txt`
  - Validate file size: reject if > 10MB
  - Upload to Cloudinary via `cloudinary.uploader.upload`
  - Return `{url, file_name, file_type}`
- Add `IsAuthenticated` permission class
- Wire up `POST /api/messages/upload/`

---

### Day 24

```
feat: add file upload component with preview and progress
```

**Changes:**

- Write `src/components/chat/FileUpload.jsx`:
  - File picker button (clip icon) next to `MessageInput`
  - On file select: show image preview (if image type) or file icon + name
  - POST to `/api/messages/upload/` with `Content-Type: multipart/form-data`
  - Show upload progress bar (use axios `onUploadProgress`)
  - On success: hold `{url, file_name, file_type}` in local state, ready to attach
  - Show error if file type/size rejected

---

### Day 25

```
feat: send file metadata through websocket after upload completes
```

**Changes:**

- `MessageInput.jsx`: after upload completes (file URL in state), allow send
- On send: emit `{type: "chat_message", content: "", file_url, file_name, file_type}` over WebSocket
- `ChatConsumer.receive()`: if `file_url` present, save `Message` with `file_url`, `file_name`, `file_type` populated
- Broadcast full message (including file fields) to group
- Clear file state in `FileUpload.jsx` after send

---

### Day 26

```
feat: render images inline and file download links in chat
```

**Changes:**

- `MessageBubble.jsx`: check `file_type` field on message
  - If `image/*`: render `<img src={file_url} className="max-w-xs rounded-lg mt-2" loading="lazy" />`
  - If `pdf` or `txt`: render file icon + `file_name` + `<a href={file_url} download>` link
- Add `loading="lazy"` on all chat images to improve scroll performance
- Test with both image and PDF uploads end-to-end

---

### Day 27

```
feat: add unread message badges and mention highlighting
```

**Changes:**

- `useChatStore`: add `lastReadMessageId` map (keyed by `channel_id`), update on channel open
- `ChannelList.jsx`: for each channel, count messages after `lastReadMessageId`; show red badge if > 0
- `MessageBubble.jsx`: scan `content` for `@<username>`; wrap match in `<span className="bg-yellow-500/20 text-yellow-300 rounded px-1">`
- Badge clears when channel is opened (update `lastReadMessageId` to latest message)

---

### Day 28

```
feat: add online/offline presence tracking via websocket
```

**Changes:**

- `ChatConsumer.connect()`: use `database_sync_to_async` to set `user.is_online = True`; broadcast `{type: "presence", user_id, is_online: true}` to group
- `ChatConsumer.disconnect()`: set `user.is_online = False`; broadcast `{type: "presence", user_id, is_online: false}`
- Frontend `useWebSocket`: handle `type == "presence"` events; update `useChatStore` members map
- `MemberList.jsx`: show green dot for `is_online: true`, gray dot for false

---

### Day 29

```
feat: ui polish — skeletons, animations, dark/light mode toggle
```

**Changes:**

- Add message send animation: new `MessageBubble` slides up with `transition-all`
- Write `MessageSkeleton.jsx` — animated gray placeholder blocks shown while fetching history
- Add channel-switch transition: fade out old messages, fade in new
- Add dark/light mode toggle button in `Sidebar.jsx` top bar — toggles `dark` class on `<html>`
- Audit all pages for consistent spacing, border-radius, hover states

---

### Day 30

```
feat: write nginx config and docker-compose.prod.yml
```

**Changes:**

- Write `nginx/nginx.conf`:
  - Serve React build from `/app/dist` for all non-API/WS routes
  - Proxy `/api/` and `/ws/` to `django:8000`
  - Set `proxy_http_version 1.1` and `Upgrade`/`Connection` headers for WebSocket
- Write `docker-compose.prod.yml`:
  - Add `nginx` service (port 80 → 443 in final prod)
  - Remove volume mounts (no live reload in prod)
  - Frontend service runs `vite build` instead of dev server
  - Django command includes `python manage.py collectstatic --noinput`
- Test full prod stack locally: `docker compose -f docker-compose.prod.yml up --build`

---

### Day 31

```
feat: deploy to render/railway with custom domain and smoke test
```

**Changes:**

- Push all final code to GitHub
- Set all environment variables in hosting dashboard (copy from `.env.example`)
- Configure custom domain DNS (CNAME to hosting provider)
- Verify HTTPS termination works (Render/Railway handles SSL)
- Verify WebSocket upgrade works through nginx (`wss://` connection in browser)
- Smoke test the full user journey:
  1. Register new account
  2. Create a server
  3. Create a text channel
  4. Send a text message (verify real-time)
  5. Upload an image (verify Cloudinary URL)
  6. Open second browser tab, verify presence tracking
- Tag release: `git tag v1.0.0 && git push --tags`

---

## Quick Reference

| Week | Days | Focus |
|------|------|-------|
| 1 | 1–7 | Django setup, Docker, CustomUser, JWT auth, React bootstrap |
| 2 | 8–14 | Server/Channel models, CRUD APIs, 3-panel layout |
| 3 | 15–21 | WebSocket consumer, message persistence, real-time chat |
| 4 | 22–31 | File uploads, UI polish, presence, deploy |

## Current Status

- ✅ Day 1 — Django project, settings, Docker stack
- ✅ Day 2 — PostgreSQL + Redis + Docker Compose
- ✅ Day 3 — CustomUser model, migrations
- ✅ Day 4 — JWT auth endpoints (register, login, refresh, profile)
- ✅ Day 5 — React + Vite frontend init
- ✅ Day 6 — Login and register pages connected to backend auth API
- ✅ Day 7 — JWT persistence, axios interceptors, protected routes
- ✅ Day 8 — Server model with invite code and membership
- ✅ Day 9 — Server CRUD endpoints (create, list, join, leave)
- ✅ Day 10 — Channel model and CRUD endpoints
- ✅ Day 11 — 3-panel Discord-like layout shell
- ✅ Day 12 — Wire server and channel data to frontend state
- ✅ Day 13 — Add create server modal and join by invite code
- ✅ Day 14 — Members list panel and server settings page
- ✅ Day 15 — Configure ASGI, Django Channels routing, and Redis channel layer
- ✅ Day 16 — Implement chat consumer (connect, auth, receive, broadcast)
- ✅ Day 17 — Add message model and persist messages in consumer
- ✅ Day 18 — Add message history REST endpoint with pagination
- ✅ Day 19 — Add useWebSocket hook with reconnect and JWT auth
- ✅ Day 20 — Render message history and live messages in chat window
- ✅ Day 21 — Add typing indicators via websocket events
- ✅ Day 22 — Configure Cloudinary storage and verify avatar upload
- ✅ Day 23 — Add file upload REST endpoint with type and size validation
- ✅ Day 24 — Add file upload component with preview and progress
- ✅ Day 25 — Send file metadata through websocket after upload completes
- ✅ Day 26 — Render images inline and file download links in chat
- ✅ Day 27 — Add unread message badges and mention highlighting
- ⬜ Day 28 — Add online/offline presence tracking via websocket ← **you are here**
