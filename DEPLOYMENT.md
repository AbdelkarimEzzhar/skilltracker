# SkillTrack — Deployment Guide

This document describes how SkillTrack is hosted today and how to operate it safely.

## Current production architecture (AWS EC2)

```
Internet → Elastic IP → nginx :80
                            ├── /      → Next.js (frontend)
                            ├── /api/* → Express (backend)
                            └── /health
         backend → MongoDB (Docker, same host)
         backend → Groq API (GROQ_API_KEY, server-side only)
```

| Component | Details |
|-----------|---------|
| Region | `eu-north-1` (default in scripts) |
| Instance | `t3.micro` (Free Tier–oriented) |
| Stack | `deploy/aws/docker-compose.prod.yml` |
| Public URL | https://skilltrack.dev (also https://51.21.63.138) |

All services run on **one EC2 instance** via Docker Compose (no ALB required for cost-sensitive setups).

---

## Quick reference — deploy scripts

Run from the **repository root**. Requires AWS CLI configured and `mongodump` only for DB sync.

| Script | Purpose |
|--------|---------|
| `deploy/aws/deploy-ec2.sh` | Create/update EC2, S3 bundle, bootstrap containers |
| `deploy/aws/configure-groq-on-ec2.sh` | Copy `GROQ_*` from local `skilltrack-backend/.env` to server |
| `deploy/aws/sync-local-db-to-ec2.sh` | **One-time** mongodump → production (overwrites live DB) |
| `deploy/aws/apply-hostname.sh` | Set `CORS_ORIGIN` for a domain (SSM or EC2 Instance Connect) |

```bash
chmod +x deploy/aws/*.sh

# First AWS deploy (generates JWT on server; optional GROQ_API_KEY=... env)
./deploy/aws/deploy-ec2.sh

# Replace failed instance / redeploy app code
FORCE_REDEPLOY=1 ./deploy/aws/deploy-ec2.sh

# Groq from your laptop .env (does not print the key)
./deploy/aws/configure-groq-on-ec2.sh

# Custom domain CORS
APP_HOSTNAME=skilltrack-inpt.ma PUBLIC_IP=51.21.63.138 ./deploy/aws/apply-hostname.sh
```

**Health check:** `http://<your-host>/health` — deploy scripts may report failure on networks that block raw IPs; verify in your browser.

**Restart all containers:**

```bash
ssh ec2-user@51.21.63.138 'cd /opt/skilltrack/deploy/aws && sudo docker compose -f docker-compose.prod.yml up -d'
```

---

## 1. Prerequisites

- AWS account with EC2, S3, IAM permissions
- Local: Node 18+, `aws` CLI, `mongodump` / `mongorestore` (for optional DB sync)
- Groq API key in `skilltrack-backend/.env` (never commit this file)

---

## 2. First-time AWS deploy

1. Clone the repo and configure AWS CLI (`aws configure`).
2. Optional: export secrets for bootstrap (otherwise admin is created on first backend start):

   ```bash
   export GROQ_API_KEY=gsk_...   # optional at deploy time; can use configure-groq-on-ec2.sh later
   ./deploy/aws/deploy-ec2.sh
   ```

3. Note the Elastic IP printed at the end.
4. Open `http://<elastic-ip>/login`.
5. Log in with `admin@skilltrack.com` / `Admin@123` unless you imported another database.

### What the deploy script creates

- S3 bucket `skilltrack-deploy-<account-id>` (private) for the app tarball
- Security group (HTTP 80, SSH 22)
- IAM role + instance profile (S3 read, SSM optional)
- EC2 + Elastic IP tagged `skilltrack-app`

### Server environment (`/opt/skilltrack/deploy/aws/.env`)

Managed on the instance — **not in git**:

- `JWT_SECRET`, `MONGO_URI`, `CORS_ORIGIN`, `GROQ_API_KEY`, `AI_PROVIDER`, cookie flags

---

## 3. One-time data migration (localhost → AWS)

Production MongoDB starts **empty**. To copy your local database **once** (users, competences, recommendations, etc.):

1. Start local MongoDB with your data.
2. Run:

   ```bash
   LOCAL_MONGO_URI='mongodb://localhost:27017/skilltrack_db' ./deploy/aws/sync-local-db-to-ec2.sh
   ```

3. If the site does not respond afterward, restart containers (see Quick reference).

**Do not run sync again** unless you intend to **overwrite** all live data with your laptop copy. After the first import, everyone using the public link shares the **deployed** database.

---

## 4. Groq chatbot

- Keys belong **only** on the backend (`GROQ_API_KEY`, `AI_PROVIDER=groq`).
- Never use `NEXT_PUBLIC_*` for API keys.
- After changing keys locally:

  ```bash
  ./deploy/aws/configure-groq-on-ec2.sh
  ```

- Restart backend if you edit `.env` manually on the server.

---

## 5. Custom domain

Browsers need a hostname without spaces. Target examples:

| Goal | Example |
|------|---------|
| Production | `skilltrack.dev` |
| INPT domain | `skilltrack-inpt.ma` |
| Free DNS | `skilltrack.duckdns.org` |
| Instant test DNS | `skilltrack.51-21-63-138.sslip.io` |

### `skilltrack.dev` (name.com)

1. **Delete** wrong records: parking IP (`208.91.x.x`), duplicate A with host `skilltrack.dev`, unused AAAA.
2. Add **A record**:
   - **Host:** leave **blank** (root domain — do not type `skilltrack.dev` in the host field)
   - **Answer:** `51.21.63.138`
3. Optional **www:** host `www` → `51.21.63.138`
4. Verify: `dig @ns1kwy.name.com skilltrack.dev A` must return `51.21.63.138`
5. Open **https://skilltrack.dev** (HTTP redirects to HTTPS; certificate is on the server)

If the browser still fails, flush DNS cache or wait up to 48 hours for propagation.

### `skilltrack-inpt.ma`

1. At your `.ma` registrar, add **A records** `@` and `www` → your Elastic IP.
2. Wait for DNS: `dig +short skilltrack-inpt.ma A`
3. Run: `APP_HOSTNAME=skilltrack-inpt.ma PUBLIC_IP=<ip> ./deploy/aws/apply-hostname.sh`
4. For HTTPS later: Certbot on EC2, then `COOKIE_SECURE=true` on backend.

### Same-origin note (current EC2 setup)

Frontend and API are served via **nginx on one host** (`/api` proxied). Use:

- `NEXT_PUBLIC_API_URL=/api` in Docker build (already set in `Dockerfile.frontend`)
- `CORS_ORIGIN=http://<your-public-host>` (comma-separated if multiple origins)

Cross-origin split (Vercel + Render) still works with `COOKIE_SAME_SITE=none` and `COOKIE_SECURE=true` — see section 8.

---

## 6. Updating application code on EC2

Code on the server comes from the S3 tarball at deploy time. To ship new code:

```bash
# Rebuild bundle and replace instance
FORCE_REDEPLOY=1 ./deploy/aws/deploy-ec2.sh
```

For small frontend-only fixes, you can `scp` changed files to `/opt/skilltrack/...` and rebuild the frontend image on the server (see operational notes in repo history).

---

## 7. Post-deploy checklist

- [ ] `http://<host>/health` returns JSON
- [ ] Admin login works
- [ ] Student pages and recommendations load
- [ ] Chatbot answers in Groq mode (not “not configured”)
- [ ] `GROQ_API_KEY` set on server; backend restarted after changes
- [ ] No `.env` or keys committed to git

---

## 8. Alternative: split hosting (Vercel + Render + Atlas)

You can still deploy frontend and backend separately:

| Service | Role |
|---------|------|
| MongoDB Atlas | Database |
| Render / Railway | `skilltrack-backend` |
| Vercel | `skilltrack-frontend` |

**Backend env:** `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGIN=https://your-frontend.vercel.app`, `GROQ_*`, `COOKIE_SAME_SITE=none`, `COOKIE_SECURE=true`

**Frontend env:** `NEXT_PUBLIC_API_URL=https://your-api.onrender.com/api` (set **before** build)

---

## 9. Common issues

| Symptom | Cause / fix |
|---------|-------------|
| User not found | Empty DB — `seed:admin` or one-time sync |
| Site unreachable after sync | Containers stopped — `docker compose up -d` |
| CORS errors | `CORS_ORIGIN` must match browser URL exactly |
| Groq not configured | Run `configure-groq-on-ec2.sh` |
| Health check fails in CI/office network | Corporate filter on IP; test in browser |
| Duplicate EN/FR in admin level dropdown | Fixed in app — French levels only |

---

## 10. Security

### Never commit

- `skilltrack-backend/.env`, `skilltrack-frontend/.env.local`
- API keys (`GROQ_API_KEY`, `JWT_SECRET`, MongoDB passwords)
- SSH private keys, `.pem` files

### Production practices

- Use a strong `JWT_SECRET` (deploy script generates one if omitted)
- Restrict SSH (security group) to your IP when possible
- Enable HTTPS before exposing cookies with `Secure` flag
- Rotate Groq/JWT keys if they were ever exposed in chat or logs
- S3 deploy bucket blocks public access by default

### `.gitignore`

The repo ignores `.env`, `.env.local`, `node_modules`, `.next`, `dist`, `*.pem`, and build artifacts.

---

## 11. Local production smoke test

```bash
# Terminal 1
cd skilltrack-backend
NODE_ENV=production CORS_ORIGIN=http://localhost:3000 npm run build && npm run start

# Terminal 2
cd skilltrack-frontend
NEXT_PUBLIC_API_URL=http://localhost:5000/api npm run build && npm run start
```

Open http://localhost:3000 and test login + chatbot.
