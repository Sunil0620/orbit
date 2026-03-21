# REVIEW.md — Orbit Chat App
> This file is used by AI agents (Claude, Codex) to review code, catch issues,
> and ensure Orbit stays consistent, secure, and production-ready.
> Load SKILL.md first, then use this file to perform reviews.

---

## 🔍 How to Use This File

When asked to "review", "audit", or "check" code in Orbit:
1. Read SKILL.md for full context
2. Apply ALL checklists below relevant to the changed files
3. Return findings in this format:

```
## Review: <filename>

### ✅ Passed
- [list things that are correct]

### ⚠️ Warnings (should fix)
- [list non-breaking issues]

### ❌ Critical (must fix before merge)
- [list blocking issues]

### 💡 Suggestions
- [optional improvements]
```

---

## 🐍 Django Backend Checklist

### Changes
- Make sure the all changes were made and verified that are working properly for that day before committing, Tell the user that the changes are working properly and give procedure to run it, so i can verify by runing them.


### Models
- [ ] Every model has a `__str__` method
- [ ] ForeignKey fields have explicit `on_delete` set
- [ ] No `null=True` on CharField/TextField (use `blank=True` only)
- [ ] UUIDs used for invite codes, not sequential integers
- [ ] `auto_now_add` for created_at, `auto_now` for updated_at
- [ ] No raw SQL — use ORM always
- [ ] Migration file exists for every model change

### Serializers
- [ ] No `fields = '__all__'` — always explicit field list
- [ ] Sensitive fields excluded (password, tokens)
- [ ] `read_only_fields` set for auto-generated fields (id, created_at)
- [ ] Nested serializers used where appropriate (e.g., sender info in messages)
- [ ] Validation logic in `validate_<field>` or `validate` methods, not in views

### Views / ViewSets
- [ ] All views have `permission_classes` set — NEVER leave empty
- [ ] `IsAuthenticated` is the default for all non-auth endpoints
- [ ] No business logic in views — delegate to model methods or services
- [ ] Correct HTTP status codes returned (201 for create, 204 for delete)
- [ ] Pagination set on list endpoints (default: 50 messages)
- [ ] `select_related` / `prefetch_related` used to avoid N+1 queries

### WebSocket Consumers
- [ ] User authenticated in `connect()` — anonymous users are closed immediately
- [ ] All ORM calls wrapped in `database_sync_to_async`
- [ ] `try/except` around JSON parsing in `receive()`
- [ ] Messages validated before saving (empty string + no file = reject)
- [ ] Group name format: `chat_<channel_id>` (not channel_name)
- [ ] `disconnect()` always calls `group_discard`
- [ ] No synchronous blocking calls inside async methods

### Security
- [ ] `DEBUG = False` in prod settings
- [ ] `SECRET_KEY` loaded from environment, never hardcoded
- [ ] `ALLOWED_HOSTS` set properly in prod
- [ ] CORS configured to allow only frontend origin, not `*` in prod
- [ ] JWT tokens have reasonable expiry (access: 15min, refresh: 7 days)
- [ ] File upload endpoint validates file type and size (max 10MB)
- [ ] No user can access channels they're not a member of

### Performance
- [ ] `select_related('sender')` on Message queryset
- [ ] Message history endpoint returns last 50 messages (not all)
- [ ] Redis channel layer configured (not InMemoryChannelLayer in prod)

---

## ⚛️ React Frontend Checklist

### Components
- [ ] No component over 200 lines — split if needed
- [ ] Props are destructured at the top of component
- [ ] `key` prop used correctly in lists (use message.id, not array index)
- [ ] No inline styles — Tailwind classes only
- [ ] Loading states shown for async operations (skeletons/spinners)
- [ ] Error states handled gracefully (not just `console.error`)

### Hooks
- [ ] `useWebSocket` handles reconnection on disconnect
- [ ] WebSocket cleanup in `useEffect` return function
- [ ] No fetch/axios calls inside render — always in `useEffect` or handlers
- [ ] `useCallback` used for WebSocket message handlers to avoid re-renders

### State (Zustand)
- [ ] Auth state in `useAuthStore` — user, tokens, isAuthenticated
- [ ] Chat state in `useChatStore` — servers, channels, messages
- [ ] Local UI state (modal open, input text) in `useState` only
- [ ] Store actions are clean functions, no side effects in state

### API Layer
- [ ] All calls go through `src/api/axiosInstance.js`
- [ ] Axios interceptor attached for JWT token injection
- [ ] Axios interceptor handles 401 → refresh token flow
- [ ] No hardcoded URLs — always use `import.meta.env.VITE_API_URL`
- [ ] No raw `fetch()` anywhere in the codebase

### WebSocket
- [ ] WS URL uses `import.meta.env.VITE_WS_URL`
- [ ] JWT passed as query param: `?token=<access_token>`
- [ ] Message received → added to Zustand store (not local state)
- [ ] Typing indicator debounced (don't send on every keypress)
- [ ] File upload completes BEFORE sending WebSocket message

### UI/UX
- [ ] Dark mode working by default (gray-900 background)
- [ ] Scrolls to bottom on new message
- [ ] Doesn't scroll to bottom if user has scrolled up (don't interrupt reading)
- [ ] Image messages render inline with max-width
- [ ] File messages show file icon + name + download link
- [ ] Timestamps formatted as relative time ("2 minutes ago")

---

## 🐳 Docker Checklist

- [ ] `docker-compose.yml` has all 4 services: django, postgres, redis, frontend
- [ ] `depends_on` used correctly (django depends on postgres and redis)
- [ ] Health checks added for postgres and redis
- [ ] `.env` file not committed (only `.env.example`)
- [ ] Volumes defined for postgres data persistence
- [ ] Frontend service proxies `/api` and `/ws` to django in dev

---

## 🔒 Security Audit (Run Before Deployment)

### Critical — Must Pass
- [ ] No `.env` file in git history (`git log --all -- .env`)
- [ ] `DEBUG=False` in `prod.py`
- [ ] `SECRET_KEY` is random and 50+ chars
- [ ] Database password is strong and not default
- [ ] CORS allows only the production frontend URL
- [ ] File uploads limited to: images (jpg, png, gif, webp), pdf, txt (max 10MB)
- [ ] WebSocket connections require valid JWT (no anonymous access)
- [ ] Users can only send messages to channels in servers they've joined

### Important — Should Pass
- [ ] Rate limiting on auth endpoints (prevent brute force)
- [ ] User avatar/file URLs are served over HTTPS (Cloudinary does this)
- [ ] Invite codes are UUID-based (not sequential/guessable)

---

## 📊 Performance Review

### Backend
- [ ] Load test WebSocket with 10+ concurrent connections
- [ ] Message list endpoint responds in < 200ms
- [ ] No N+1 queries (check Django debug toolbar in dev)

### Frontend
- [ ] Lighthouse score > 80 on Performance
- [ ] No unnecessary re-renders (use React DevTools Profiler)
- [ ] Bundle size < 500KB gzipped (check with `vite build`)
- [ ] Images lazy-loaded in chat history

---

## 📝 Code Style

### Python
- Follow PEP 8
- Max line length: 100 chars
- Imports order: stdlib → third-party → local (use isort)
- No unused imports

### JavaScript/JSX
- Use `const` over `let`, never `var`
- Arrow functions for callbacks
- Async/await over `.then()` chains
- No unused variables or imports
- Consistent semicolons (none — ESLint will enforce)

---

## 🗓️ Week-by-Week Review Schedule

| Week | Focus Areas |
|---|---|
| Week 1 | Models, auth endpoints, JWT setup, Docker |
| Week 2 | Server/Channel CRUD, permissions, frontend layout |
| Week 3 | WebSocket consumer, real-time messaging, useWebSocket hook |
| Week 4 | File uploads, security audit, performance, deployment |

---

## 🚨 Auto-Fail Conditions

These automatically fail a review and must be fixed before any merge:

1. `fields = '__all__'` in any serializer
2. ORM call inside async consumer without `database_sync_to_async`
3. Hardcoded `SECRET_KEY`, API key, or password in any file
4. `permission_classes = []` on any non-auth endpoint
5. `DEBUG = True` in prod settings
6. Raw `fetch()` used instead of Axios in frontend
7. `key={index}` used in a message list map
8. Anonymous WebSocket connections allowed in consumer
