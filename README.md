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

## For AI Agents

- Read **SKILL.md** before writing any code
- Use **REVIEW.md** to audit code before any commit
- Check **PROJECT_PLAN.md** for the full roadmap and architecture

---

## Project Structure

See `PROJECT_PLAN.md` for the full folder structure and month roadmap.

---

Built with Django, Channels, React, and Vite.
