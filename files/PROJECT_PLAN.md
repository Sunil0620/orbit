# 🪐 Orbit — Real-Time Team Chat App
> "Stay in orbit with your team."

A Discord/Slack-inspired real-time chat platform built with Django Channels, React + Vite, PostgreSQL, Redis, Docker, and Cloudinary.

---

## 🧠 Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Backend | Django 5 + Django REST Framework | Battle-tested, fast to build |
| Real-Time | Django Channels + WebSockets | Best async WebSocket support in Django |
| Channel Layer | Redis | Required by Channels for pub/sub |
| Frontend | React 18 + Vite | Blazing fast, modern DX |
| Styling | Tailwind CSS | Discord-like UI fast |
| Database | PostgreSQL | Relational, reliable, production-grade |
| File Storage | Cloudinary | Free tier, no server storage needed |
| Auth | JWT (SimpleJWT) | Stateless, works with WebSockets |
| Containerization | Docker + Docker Compose | Full stack in one command |
| Deployment | Render / Railway | Free tier friendly |

---

## 📁 Folder Structure

```
orbit/
├── backend/                        # Django project
│   ├── core/                       # Django settings, urls, asgi
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── dev.py
│   │   │   └── prod.py
│   │   ├── urls.py
│   │   └── asgi.py                 # CRITICAL: enables WebSockets
│   ├── apps/
│   │   ├── accounts/               # User auth, profiles
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   ├── servers/                # Servers (like Discord guilds)
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   ├── channels_chat/          # Channels/rooms inside servers
│   │   │   ├── models.py
│   │   │   ├── consumers.py        # WebSocket consumer (THE CORE)
│   │   │   ├── routing.py          # WebSocket URL routing
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   ├── messages/               # Chat messages + file attachments
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   └── views.py
│   │   └── notifications/          # Unread counts, mentions
│   │       ├── models.py
│   │       └── consumers.py
│   ├── requirements.txt
│   ├── manage.py
│   └── Dockerfile
│
├── frontend/                       # React + Vite project
│   ├── src/
│   │   ├── api/                    # Axios instances + API calls
│   │   │   ├── axiosInstance.js
│   │   │   ├── auth.js
│   │   │   ├── servers.js
│   │   │   └── messages.js
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.jsx     # Server list (left panel)
│   │   │   │   ├── ChannelList.jsx # Channel list (middle panel)
│   │   │   │   └── MemberList.jsx  # Online members (right panel)
│   │   │   ├── chat/
│   │   │   │   ├── ChatWindow.jsx  # Main chat area
│   │   │   │   ├── MessageBubble.jsx
│   │   │   │   ├── MessageInput.jsx
│   │   │   │   └── FileUpload.jsx
│   │   │   ├── server/
│   │   │   │   ├── ServerCard.jsx
│   │   │   │   └── CreateServerModal.jsx
│   │   │   └── ui/                 # Reusable: Avatar, Modal, Badge
│   │   ├── hooks/
│   │   │   ├── useWebSocket.js     # Custom WS hook
│   │   │   ├── useAuth.js
│   │   │   └── useMessages.js
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── SocketContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Home.jsx
│   │   │   └── ChatPage.jsx
│   │   ├── store/                  # Zustand state management
│   │   │   ├── useAuthStore.js
│   │   │   └── useChatStore.js
│   │   ├── utils/
│   │   │   ├── formatDate.js
│   │   │   └── cloudinary.js       # Cloudinary upload helper
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── Dockerfile
│
├── nginx/                          # Reverse proxy (prod)
│   └── nginx.conf
├── docker-compose.yml              # dev
├── docker-compose.prod.yml         # prod
├── .env.example
├── SKILL.md                        # AI agent instructions
├── REVIEW.md                       # AI code review guide
└── README.md
```

---

## 📅 Month Roadmap

### Week 1 — Foundation & Auth (Days 1–7)
**Goal: Django backend running, JWT auth working, Docker up**

| Day | Task |
|---|---|
| 1 | Init Django project, configure settings (base/dev/prod), install DRF, Channels, SimpleJWT |
| 2 | Set up PostgreSQL + Docker Compose (django + postgres + redis) |
| 3 | Build `accounts` app: CustomUser model, register/login/logout endpoints |
| 4 | JWT auth: access + refresh tokens, protected routes |
| 5 | Init React + Vite frontend, install Tailwind, Axios, Zustand, React Router |
| 6 | Build Login + Register pages, connect to backend auth API |
| 7 | Auth persistence (JWT in httpOnly cookies or localStorage), protected routes in React |

**Milestone:** You can register, login, and stay logged in across refreshes ✅

---

### Week 2 — Servers & Channels (Days 8–14)
**Goal: Discord-like server/channel structure in place**

| Day | Task |
|---|---|
| 8 | Build `servers` app: Server model (name, icon, owner, members) |
| 9 | Server CRUD endpoints: create, list, join, leave |
| 10 | Build `channels_chat` app: Channel model (name, type: text/voice, server FK) |
| 11 | Channel CRUD: create/delete channels inside a server |
| 12 | Frontend: Sidebar (server icons), ChannelList panel |
| 13 | Frontend: Create/Join server modals, invite code system |
| 14 | Members list panel, server settings page |

**Milestone:** Full Discord-like 3-panel layout with real server/channel data ✅

---

### Week 3 — Real-Time WebSockets (Days 15–21)
**Goal: Messages flying in real-time**

| Day | Task |
|---|---|
| 15 | Configure `asgi.py`, Django Channels routing, Redis channel layer |
| 16 | Build `ChatConsumer` (connect, disconnect, receive, send) |
| 17 | Message model: content, sender, channel, timestamp, file attachment |
| 18 | Persist messages to PostgreSQL inside consumer |
| 19 | Frontend: `useWebSocket` hook with reconnection logic |
| 20 | Frontend: ChatWindow — render message history, live incoming messages |
| 21 | Typing indicators ("Sunil is typing...") via WebSocket events |

**Milestone:** Real-time messaging working end-to-end ✅

---

### Week 4 — Files, Polish & Deploy (Days 22–31)
**Goal: File sharing, UI polish, and live on the internet**

| Day | Task |
|---|---|
| 22 | Cloudinary setup: account, API keys, Django cloudinary-storage |
| 23 | File/image upload endpoint (REST, not WebSocket) |
| 24 | Frontend: FileUpload component, image preview before send |
| 25 | Send file metadata through WebSocket after upload completes |
| 26 | Render images inline in chat, file download links |
| 27 | Unread message badges, @mention highlighting |
| 28 | Online/offline presence tracking via WebSocket connect/disconnect |
| 29 | UI polish: dark mode, animations, loading skeletons |
| 30 | Write Nginx config, docker-compose.prod.yml |
| 31 | Deploy to Render/Railway, custom domain, final testing |

**Milestone:** Orbit is LIVE on the internet 🚀 ✅

---

## 🖼️ File/Image Sharing — How It Works

This is a two-step process (REST + WebSocket combined):

```
Step 1: User picks a file
        ↓
Step 2: Frontend uploads file directly to Cloudinary via REST API
        ↓ (Cloudinary returns a secure URL)
Step 3: Frontend sends a WebSocket message with:
        { type: "file_message", url: "https://res.cloudinary.com/...", filename: "cat.png" }
        ↓
Step 4: Consumer saves message to DB with file_url field
        ↓
Step 5: Consumer broadcasts to all room members
        ↓
Step 6: Other users' ChatWindow renders image inline
```

Why this approach?
- WebSockets aren't designed for binary data blobs
- Cloudinary handles CDN, compression, and transformations for free
- Files are accessible forever via URL, not tied to your server

---

## 🌟 Core Features

- [x] JWT Authentication (register, login, refresh)
- [x] Create/Join servers with invite codes
- [x] Text channels inside servers
- [x] Real-time messaging (WebSockets)
- [x] Message history (PostgreSQL)
- [x] File + Image sharing (Cloudinary)
- [x] Typing indicators
- [x] Online/offline presence
- [x] Unread message badges
- [x] Dark mode UI
- [x] Docker Compose (dev + prod)
- [x] Deployed on Render/Railway

---

## 🔮 Future Features (Post Month 1)

- add chat window img in readme.md
- Message reactions (emoji)
- Voice channels (WebRTC)
- Thread replies
- Search messages
- Push notifications
- Mobile responsive PWA
- AI chat summarizer (Claude API 👀)
