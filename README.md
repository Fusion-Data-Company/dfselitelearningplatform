# DFS-215 Elite Learning Platform (Vercel + Neon)

## Deploying on Vercel
- **Build command**: `npm run build`
- **Output**: `dist/public`
- **API**: `api/[...path].ts` (serverless Express)
- **SPA routing**: handled via `vercel.json` rewrites

### Required environment variables
- `DATABASE_URL` – Neon connection string (serverless driver)
- `OPENAI_API_KEY` – for agents/voice (optional but recommended)
- `MCP_SERVER_SECRET` – shared secret for MCP/agent calls
- `ADMIN_SECRET` – header guard for admin/import endpoints
- `DEFAULT_ROLE` – set to `admin` to unlock admin UI (default: `student`)
- `ELEVENLABS_API_KEY` (optional) – voice output
- `PERPLEXITY_API_KEY` (optional) – richer voice answers

### Health check
- `GET /api/health` – verifies cold-start and DB connectivity.

### Smoke-test checklist (post-deploy)
- `GET /api/health`
- `GET /api/lessons/recent`
- `GET /api/question-banks`
- `GET /api/iflash/cards`
- `POST /api/exams/:bankId/start` (sample bank)
- `POST /api/admin/import/status` (with `x-admin-secret`)

### Admin/import endpoints (guarded)
Use header `x-admin-secret: <ADMIN_SECRET>` (or `mcp-server-secret`):
- `GET /api/admin/import/status`
- `POST /api/admin/import/all`
- `POST /api/admin/import/clear`

### Lesson and content endpoints (key ones)
- `GET /api/lessons/recent`
- `GET /api/lessons/slug/:slug`
- `GET /api/lessons/enhanced-list`
- `GET /api/lessons/enhanced/:slug`
- `POST /api/lessons/:lessonId/checkpoint-progress`
- `POST /api/lessons/:id/enhanced-progress`
- `POST /api/lessons/:id/grade-quiz`

### Assessments & flashcards
- `GET /api/question-banks`, `POST /api/exams/:bankId/start`, `POST /api/exams/:sessionId/answer`, `POST /api/exams/:sessionId/finish`, `POST /api/exams/:sessionId/flag`, `GET /api/exams/:sessionId/status`
- `GET /api/flashcards`, `GET /api/flashcards/review`, `POST /api/flashcards/:id/review`
- `POST /api/iflash/generate` (body: `sourceIds`, `style`, `maxCards`)

### Agents & Voice
- `POST /api/agents/:agentId/chat` (uses MCP context + OpenAI)
- `POST /api/voice-qa` (question, context → answer/audio)

## Local development
```
npm install
npm run dev
```

## Notes
- Frontend expects the above endpoints; ensure `published` lessons and slugs are set in the DB.
- Import is manual on Vercel to avoid long cold-starts. Run it once after env vars are set.

