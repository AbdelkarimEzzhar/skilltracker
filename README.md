# SkillTrack

SkillTrack is a full-stack academic and professional companion platform for students and administrators. It combines skill tracking, goals, career roadmap planning, AI-assisted recommendations, and an embedded chatbot, with an admin dashboard for users and competences.

**Live deployment (AWS):** http://51.21.63.138 — see [DEPLOYMENT.md](./DEPLOYMENT.md) for hosting, updates, and custom domains (e.g. `skilltrack-inpt.ma`).

## Features

### Students
- Dashboard, profile, and academic records
- Skills and competences with progress
- Goals and career roadmap
- AI recommendations (trainable from feedback)
- Achievements and XP / activity profile
- Floating **chatbot** (Groq) with customizable UI (position, theme, history)

### Admins
- Dashboard and statistics
- User management (paginated)
- Competence management (French level labels: Débutant → Expert)

### Platform
- JWT auth with **HttpOnly** cookies
- Role-based access (ADMIN / STUDENT)
- REST API (Express + TypeScript)
- Responsive Next.js UI (French UI)

## Tech stack

| Layer | Stack |
|--------|--------|
| Frontend | Next.js 16 (App Router), React, TypeScript, Tailwind, Zustand, Axios |
| Backend | Node.js, Express, TypeScript, Mongoose |
| Database | MongoDB |
| AI chat | Groq API (server-side only) |
| Production | Docker on AWS EC2 (nginx + Next.js + Express + MongoDB) |

## Project layout

```
skill/
├── skilltrack-backend/       Express API, models, recommendation engine, chat
├── skilltrack-frontend/      Next.js app (student + admin + chatbot)
├── deploy/aws/               EC2 Docker deployment scripts
├── scripts/                  verify-full-app.mjs, verify-app.sh
├── backup_mars_2026/         Optional BSON backup metadata (see DEPLOYMENT)
├── README.md
└── DEPLOYMENT.md
```

## Local development

### Prerequisites
- Node.js 18+
- MongoDB 6+ running locally
- npm

### 1. Backend

```bash
cd skilltrack-backend
npm install
cp .env.example .env
# Edit .env: MONGO_URI, JWT_SECRET, GROQ_API_KEY (for chatbot)
npm run seed          # optional: sample data if backup BSON present
npm run seed:admin    # ensures admin@skilltrack.com exists
npm run dev
```

API: http://localhost:5000/api — health: http://localhost:5000/health

### 2. Frontend

```bash
cd skilltrack-frontend
npm install
cp .env.example .env.local
npm run dev
```

App: http://localhost:3000

### Default admin (after seed:admin)

| Email | Password |
|--------|----------|
| admin@skilltrack.com | Admin@123 |

Local DB may also contain users from your own imports; use the same credentials as in your MongoDB.

## Environment variables

### Backend (`skilltrack-backend/.env`)

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | e.g. `mongodb://localhost:27017/skilltrack_db` |
| `JWT_SECRET` | Long random string (production) |
| `JWT_EXPIRE` | e.g. `7d` |
| `PORT` | `5000` |
| `NODE_ENV` | `development` or `production` |
| `CORS_ORIGIN` | Frontend origin, e.g. `http://localhost:3000` |
| `AI_PROVIDER` | `groq` (default) or `deepseek` |
| `GROQ_API_KEY` | From [Groq Console](https://console.groq.com) — **never commit** |
| `GROQ_BASE_URL` | `https://api.groq.com/openai/v1` |
| `GROQ_MODEL` | e.g. `llama-3.1-8b-instant` |

Optional cross-domain cookies (split frontend/API hosts): `COOKIE_SAME_SITE=none`, `COOKIE_SECURE=true`.

See `.env.example` for the full list.

### Frontend (`skilltrack-frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` (use `/api` when frontend and API share one host) |

## API overview

Base URL: `/api`

| Area | Examples |
|------|----------|
| Auth | `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` |
| Admin | `GET /admin/stats` |
| Users | `GET /users`, `PUT /users/:id` (admin) |
| Competences | `GET /competences`, `POST /competences` (admin) |
| Student | `/student/dashboard`, `/student/skills`, `/student/goals`, `/student/recommendations`, … |
| Chat | `POST /chat` (authenticated, Groq on server) |

## Recommendation engine

Formations are scored against active goals using features (goal match, coverage, keywords, profile, level, timeline). Students can **complete** or **ignore** cards; `POST /student/recommendations/train` updates the model.

## NPM scripts

**Backend:** `dev`, `build`, `start`, `seed`, `seed:admin`, `typecheck`

**Frontend:** `dev`, `build`, `start`, `typecheck`

## Verification

```bash
node scripts/verify-full-app.mjs
```

Options: `SKIP_FRONTEND_BUILD=true`, `SKIP_BACKEND_BUILD=true`, `VERIFY_STUDENT_EMAIL`, `VERIFY_STUDENT_PASSWORD`.

## Deployment

Production is documented in **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

| Path | Use case |
|------|----------|
| `deploy/aws/deploy-ec2.sh` | First deploy to AWS EC2 (Free Tier–friendly) |
| `deploy/aws/configure-groq-on-ec2.sh` | Push Groq key from local `.env` to server |
| `deploy/aws/sync-local-db-to-ec2.sh` | **One-time** copy of local MongoDB to production |
| `deploy/aws/apply-hostname.sh` | Custom domain / CORS (DuckDNS, `.ma`, etc.) |

**Security:** Never commit `.env`, API keys, or SSH private keys. Keys live only on the server or in your local `.env`.

## Troubleshooting

| Issue | Fix |
|--------|-----|
| Frontend cannot reach API | Check `NEXT_PUBLIC_API_URL` and `CORS_ORIGIN` |
| Login “User not found” on AWS | Run `npm run seed:admin` in backend container or one-time DB sync |
| Groq chat not configured | Set `GROQ_API_KEY` on backend; run `configure-groq-on-ec2.sh` on AWS |
| Site down after DB sync | `docker compose -f deploy/aws/docker-compose.prod.yml up -d` on EC2 |

## License

ISC
