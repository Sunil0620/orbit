# SKILL.md — Orbit Chat App
> Read this file FIRST before writing any code, creating any file, or making any suggestion.
> This is the single source of truth for how Orbit is built.

---

## 🪐 What is Orbit?

Orbit is a real-time team chat application inspired by Discord and Slack.
It is built by a solo developer (Sunil) as a portfolio project over 1 month.

**Live Demo Target:** https://orbit.sunil.dev (or similar)
**GitHub:** https://github.com/Sunil0620/

---

## 🧠 Stack — Never Deviate From This

| Layer | Technology | Version |
|---|---|---|
| Backend Language | Python | 3.11+ |
| Backend Framework | Django | 5.x |
| REST API | Django REST Framework (DRF) | latest |
| WebSockets | Django Channels | 4.x |
| Channel Layer | channels-redis | latest |
| Auth | djangorestframework-simplejwt | latest |
| Database | PostgreSQL | 15+ |
| Cache/PubSub | Redis | 7+ |
| File Storage | Cloudinary (cloudinary-storage) | latest |
| Frontend Framework | React | 18 |
| Frontend Bundler | Vite | 5.x |
| Styling | Tailwind CSS | 3.x |
| State Management | Zustand | latest |
| HTTP Client | Axios | latest |
| Routing | React Router v6 | latest |
| Containerization | Docker + Docker Compose | latest |

**DO NOT suggest:**
- Django templates for the frontend (we use React)
- Django ORM sync inside async consumers without `database_sync_to_async`
- localStorage for storing JWT (use httpOnly cookies in prod)
- Any other state manager instead of Zustand
- SQLite (always PostgreSQL)

---

## 📁 Project Structure

```
orbit/
├── backend/                  # Django project root
│   ├── core/                 # Settings, urls, asgi
│   │   ├── settings/
│   │   │   ├── base.py       # Shared settings
│   │   │   ├── dev.py        # Development overrides
│   │   │   └── prod.py       # Production overrides
│   │   ├── urls.py
│   │   └── asgi.py           # WebSocket entry point
│   ├── apps/
│   │   ├── accounts/         # User model, auth
│   │   ├── servers/          # Server (guild) model
│   │   ├── channels_chat/    # Channel model + WebSocket consumer
│   │   ├── messages/         # Message model + file attachments
│   │   └── notifications/    # Unread counts, mentions
│   ├── requirements.txt
│   ├── manage.py
│   └── Dockerfile
│
├── frontend/                 # React + Vite project
│   ├── src/
│   │   ├── api/              # All Axios calls live here
│   │   ├── components/       # Reusable UI components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── context/          # React context providers
│   │   ├── pages/            # Page-level components
│   │   ├── store/            # Zustand stores
│   │   └── utils/            # Helper functions
│   └── Dockerfile
│
├── nginx/                    # Reverse proxy config
├── docker-compose.yml
├── docker-compose.prod.yml
└── .env.example
```

---

## 🔑 Key Models — Know These Before Writing Anything

### CustomUser (accounts/models.py)
```python
class CustomUser(AbstractUser):
    avatar = CloudinaryField('avatar', blank=True, null=True)
    bio = models.TextField(blank=True)
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(auto_now=True)
```

### Server (servers/models.py)
```python
class Server(models.Model):
    name = models.CharField(max_length=100)
    icon = CloudinaryField('icon', blank=True, null=True)
    owner = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='owned_servers')
    members = models.ManyToManyField(CustomUser, related_name='servers', blank=True)
    invite_code = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### Channel (channels_chat/models.py)
```python
class Channel(models.Model):
    CHANNEL_TYPES = [('text', 'Text'), ('announcement', 'Announcement')]
    name = models.CharField(max_length=100)
    server = models.ForeignKey(Server, on_delete=models.CASCADE, related_name='channels')
    channel_type = models.CharField(max_length=20, choices=CHANNEL_TYPES, default='text')
    created_at = models.DateTimeField(auto_now_add=True)
```

### Message (messages/models.py)
```python
class Message(models.Model):
    channel = models.ForeignKey(Channel, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    content = models.TextField(blank=True)
    file_url = models.URLField(blank=True, null=True)       # Cloudinary URL
    file_name = models.CharField(max_length=255, blank=True)
    file_type = models.CharField(max_length=50, blank=True)  # image/pdf/etc
    is_edited = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

---

## 🔌 WebSocket Architecture

### Connection URL Pattern
```
ws://localhost:8000/ws/chat/<channel_id>/
```

### Consumer Events (channels_chat/consumers.py)

The consumer handles these message types:

| type | Direction | Payload |
|---|---|---|
| `chat_message` | client → server | `{content, file_url?, file_name?}` |
| `chat_message` | server → client | `{id, content, sender, timestamp, file_url?}` |
| `typing` | client → server | `{is_typing: bool}` |
| `typing` | server → client | `{user_id, username, is_typing}` |
| `presence` | server → client | `{user_id, is_online}` |

### Consumer Pattern (ALWAYS use this)
```python
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.channel_id = self.scope['url_route']['kwargs']['channel_id']
        self.room_group_name = f'chat_{self.channel_id}'
        self.user = self.scope['user']

        # Auth check
        if self.user.is_anonymous:
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        # parse JSON, save to DB, broadcast to group
        pass

    async def chat_message(self, event):
        # send to WebSocket client
        await self.send(text_data=json.dumps(event['message']))
```

**CRITICAL RULES for consumers:**
- ALWAYS use `database_sync_to_async` when touching the ORM
- NEVER use `sync` ORM calls directly inside async consumers
- ALWAYS validate the user is authenticated in `connect()`
- ALWAYS use `try/except` when parsing incoming JSON

---

## 🖼️ File Upload Flow

File sharing uses a **two-step process**. Never upload files directly over WebSocket.

```
1. User selects file in FileUpload.jsx
2. Frontend POSTs file to /api/messages/upload/ (REST endpoint)
3. Backend uploads to Cloudinary, returns { url, file_name, file_type }
4. Frontend sends WebSocket message:
   { type: "chat_message", content: "", file_url: url, file_name: name }
5. Consumer saves Message with file_url to DB
6. Consumer broadcasts to room group
7. All clients render image/file inline
```

---

## 🔐 Auth Flow

- Registration: `POST /api/auth/register/`
- Login: `POST /api/auth/token/` → returns `access` + `refresh`
- Refresh: `POST /api/auth/token/refresh/`
- All API calls send: `Authorization: Bearer <access_token>`
- WebSocket auth: JWT passed as query param `?token=<access_token>`
  then validated in Channels middleware

---

## 🎨 Frontend Conventions

### Component Naming
- Pages: `PascalCase`, in `src/pages/`
- Components: `PascalCase`, in `src/components/`
- Hooks: `camelCase` starting with `use`, in `src/hooks/`
- Utils: `camelCase`, in `src/utils/`

### State Rules
- Server/user auth state → Zustand (`useAuthStore`)
- Chat messages, channels → Zustand (`useChatStore`)
- Local UI state (modal open, input value) → `useState`
- Never use Redux. Never use Context for frequently updating state.

### Tailwind Conventions
- Dark mode via `dark:` prefix (dark mode by default)
- Discord-like color palette:
  - Background: `bg-gray-900`
  - Sidebar: `bg-gray-800`
  - Active channel: `bg-gray-700`
  - Text primary: `text-white`
  - Text muted: `text-gray-400`
  - Accent: `bg-indigo-500`

### API Calls
- ALL API calls go through `src/api/axiosInstance.js`
- NEVER use raw `fetch()` — always use Axios
- NEVER hardcode API URLs — use environment variables

---

## 🐳 Docker

### Services in docker-compose.yml
- `django` — backend (port 8000)
- `postgres` — database (port 5432)
- `redis` — channel layer (port 6379)
- `frontend` — React dev server (port 5173)

### Environment Variables (always use .env, never hardcode)
```
DEBUG=True
SECRET_KEY=...
DATABASE_URL=postgres://...
REDIS_URL=redis://redis:6379
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

---

## ✅ Code Quality Rules

1. **No print() in production** — use Python `logging` module
2. **No inline styles** in React — Tailwind classes only
3. **All API serializers must have explicit `fields`** — never use `fields = '__all__'`
4. **Every model must have `__str__`**
5. **All Django views must have permission classes** — no unprotected endpoints
6. **Frontend components over 200 lines** — must be broken into smaller components
7. **Git commits**: use conventional commits — `feat:`, `fix:`, `chore:`, `docs:`

---

## 📦 Key Dependencies

### Backend (requirements.txt)
```
django>=5.0
djangorestframework
django-cors-headers
channels[daphne]
channels-redis
djangorestframework-simplejwt
cloudinary
django-cloudinary-storage
psycopg2-binary
python-decouple
```

### Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "react-router-dom": "^6",
    "axios": "latest",
    "zustand": "latest",
    "tailwindcss": "^3"
  }
}
```

---

## 🚫 Never Do This

- Never use `python manage.py runserver` in production → use Daphne
- Never store files on the Django server → always Cloudinary
- Never use Django sessions for WebSocket auth → use JWT
- Never write business logic in views → put it in services or model methods
- Never use `channel_name` as room group → always use `chat_<channel_id>`
- Never skip migrations → always run after model changes
- Never commit `.env` files → always use `.env.example`
