# 🪐 Orbit

> A real-time team chat app. Discord meets Slack — built from scratch.

**Stack:** Django · Django Channels · React · Vite · PostgreSQL · Redis · Cloudinary · Docker

---

## Quick Start (Development)

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd orbit

# 2. Copy environment file
cp .env.example .env
# Fill in your values in .env

# 3. Start everything with Docker
docker compose up --build

# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# Django Admin: http://localhost:8000/admin
```

## Quick Checks

```bash
# Backend test suite
.venv313/bin/python backend/manage.py test --settings=core.settings.test

# Frontend test suite
cd frontend && npm run test
```

---

## Production Deployment

```bash
# 1. Copy and fill in your production values
cp .env.example .env
# Set ALLOWED_HOSTS, CORS_ALLOWED_ORIGINS, SECRET_KEY, DB_*, CLOUDINARY_*, etc.

# 2. Build and start all services
docker compose -f docker-compose.prod.yml up -d --build

# App runs at http://your-server-ip (nginx on port 80)
# WebSocket connections route through /ws/ automatically
```

---

## Managed Deployment Order

For the stack you picked:

1. Create Supabase Postgres and copy the Session pooler or direct `DATABASE_URL`
2. Create a Cloudinary product environment and copy `CLOUDINARY_*`
3. Create a Render Key Value instance for Redis
4. Deploy the Django ASGI backend to Render
5. Deploy the Vite frontend to Vercel
6. Add the final Vercel domain to backend CORS / CSRF settings and redeploy the backend

### Backend on Render

- Root directory: `backend`
- Build command: `pip install -r requirements.txt && python manage.py collectstatic --noinput`
- Start command: `python manage.py migrate && daphne -b 0.0.0.0 -p $PORT core.asgi:application`

Important backend env vars:

- `DJANGO_SETTINGS_MODULE=core.settings.prod`
- `SECRET_KEY=...`
- `DATABASE_URL=...`
- `DB_SSLMODE=require`
- `REDIS_URL=...` or `REDIS_HOST=...` with `REDIS_PORT=...`
- `CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app`
- `CSRF_TRUSTED_ORIGINS=https://your-frontend.vercel.app`
- `CLOUDINARY_CLOUD_NAME=...`
- `CLOUDINARY_API_KEY=...`
- `CLOUDINARY_API_SECRET=...`

### Frontend on Vercel

- Root directory: `frontend`
- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`

Frontend env vars:

- `VITE_API_URL=https://your-backend.onrender.com/api`
- `VITE_WS_URL=wss://your-backend.onrender.com`

Notes:

- `frontend/vercel.json` handles SPA deep-link rewrites for React Router.
- `render.yaml` provisions a Render web service plus Key Value instance if you want to use a Blueprint.
- `api/health/` is available for Render health checks.

---

## Project Structure

See `PROJECT_PLAN.md` for the full folder structure and month roadmap.

---

Built with Django, Channels, React, and Vite.
