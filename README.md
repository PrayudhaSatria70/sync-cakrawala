# SYNC Cakrawala — Multi-Division Operations Platform

> **Complete Implementation Baseline v3.0 (Revision 3.2)**  
> **Frontend & Fullstack Engineering Track • Ristek SGA Cakrawala**  
> *Academic institutional operations engineered to enterprise standards.*

---

## 1. Project Overview & Problem Statement

**SGA Cakrawala** coordinates eight divisions and over twenty concurrent programs each semester. Operational information was previously fragmented across instant messaging groups, offline meeting notes, spreadsheets, and disposition letters. 

SYNC Cakrawala directly addresses and eliminates the **three case study failure modes**:

1. **Information Not Synchronized (Stage & Audio Specifications)**:
   - *Failure*: Technical audio channel adjustments trapped in Acara meeting notes failed to reach Logistics, resulting in vendors arriving on event day with incorrect equipment.
   - *SYNC Solution*: Central Document Center with **Human-in-the-Loop extraction** that identifies affected divisions and automatically provisions tracked execution tasks for Logistics upon reviewer approval.
2. **Approval Bottleneck (Sponsorship Proposal)**:
   - *Failure*: Sponsorship proposal waited three weeks because the next approver in sequence was ambiguous.
   - *SYNC Solution*: Explicit visual multi-step **Approval Chain** (PIC → Finance Approver → Director) with real-time owner visibility, SLA age tracking, and auditable Return/Revision flows.
3. **Duplicate Ordering (Vendor Conflict)**:
   - *Failure*: Acara and Logistics placed duplicate equipment orders with the same vendor on the same day.
   - *SYNC Solution*: **Conflict Center** with automated cross-division anomaly detection, side-by-side order comparison (e.g. 100 vs 150 units), and one-click PIC intervention to merge or escalate purchase orders.

---

## 2. Architecture Diagram

```
                             [ User Browser ]
                                    │
                                    ▼ HTTPS
                      ┌──────────────────────────────┐
                      │      Frontend (Vercel)       │
                      │     Next.js 15 / React 19    │
                      │  Tailwind CSS Design System  │
                      │   App Router (/dashboard,    │
                      │    /tasks, /approvals, etc.) │
                      └──────────────┬───────────────┘
                                     │
                                     ▼ REST / JSON (Credentials: Include)
                      ┌──────────────────────────────┐
                      │    Backend Service (Railway) │
                      │       NestJS 11 REST API     │
                      │       (Port dynamic/$PORT)   │
                      ├──────────────────────────────┤
                      │ Guards: Auth, RBAC, Division │
                      │ Interceptors: Request ID     │
                      │ Filters: Safe HttpException  │
                      └──────────────┬───────────────┘
                                     │
                     ┌───────────────┴───────────────┐
                     ▼                               ▼
        ┌────────────────────────┐      ┌────────────────────────┐
        │  Railway PostgreSQL DB │      │  Binary Object Storage │
        │  Prisma ORM (Postgres) │      │ (Local Disk / S3 Blob) │
        │ (Users, Roles, Tasks,  │      │ (Safe UUID Keyed MIME) │
        │  Docs, Approvals, etc) │      │                        │
        └────────────────────────┘      └────────────────────────┘
```

---

## 3. Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS (Hosted on **Vercel**).
- **Backend**: NestJS 11, Express, Class-Validator, Class-Transformer (Hosted on **Railway**).
- **Data & ORM**: Prisma ORM 6, **PostgreSQL** (Hosted on **Railway**).
- **Identity & Session**: Scoped Local Authentication + Google Workspace OIDC (`express-session` with HTTP-only cookies, `SameSite=None; Secure` for cross-origin Vercel/Railway production, and bcrypt password hashing).
- **Design Tokens**: Cakrawala Navy (`#16324F`), Cakrawala Teal (`#087EA4`), Light Cyan (`#DDF3F8`), Success (`#18A874`), Warning (`#F4A62A`), Danger (`#EF6A6A`), Surface (`#F3F8FC`), Border (`#DCE7EF`).

---

## 4. Local Development Setup

### Prerequisites
- Node.js >= 20
- npm >= 10
- PostgreSQL >= 14 (or local Docker container / remote Railway PostgreSQL instance)

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/PrayudhaSatria70/sync-cakrawala.git
   cd sync-cakrawala
   ```

2. **Install monorepo dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment files**:
   ```bash
   cp .env.example apps/api/.env
   cp .env.example apps/web/.env.local  # or set NEXT_PUBLIC_API_URL
   ```

4. **Run database migration & seed demo dataset**:
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

5. **Start development servers**:
   ```bash
   npm run dev
   ```
   - Frontend UI: `http://localhost:3000`
   - Backend API: `http://localhost:4000`

---

## 5. Environment Variables Reference

### Backend (`apps/api/.env` / Railway Service Variables)
| Variable | Default / Example | Purpose |
|---|---|---|
| `PORT` | `4000` (dynamic on Railway) | NestJS HTTP Port |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | PostgreSQL connection string (or `${{Postgres.DATABASE_URL}}` on Railway) |
| `SESSION_SECRET` | `"change-me-in-production"` | Cookie signing secret (use 64-char random hex in prod) |
| `WEB_ORIGIN` | `"http://localhost:3000"` | Allowed CORS origins (comma-separated, e.g. `https://sync-cakrawala.vercel.app`) |
| `COOKIE_SAME_SITE` | `"lax"` (dev) / `"none"` (prod) | Cookie SameSite policy (`none` for cross-site Vercel to Railway) |
| `COOKIE_SECURE` | `"false"` (dev) / `"true"` (prod) | Require HTTPS for session cookies |
| `STORAGE_DRIVER` | `"local"` | Binary driver: `local` or `s3` |
| `STORAGE_LOCAL_PATH`| `"./storage"` | Local uploaded files directory |
| `GOOGLE_OIDC_ENABLED`| `"false"` | Toggles Google Workspace OIDC |
| `GOOGLE_CLIENT_ID` | `""` | Google Cloud OAuth2 Client ID |
| `GOOGLE_CLIENT_SECRET`| `""` | Google Cloud OAuth2 Client Secret |
| `ALLOWED_EMAIL_DOMAIN`| `"cakrawala.ac.id"` | Required institutional email domain |

### Frontend (`apps/web/.env.local` / Vercel Environment Variables)
| Variable | Default / Example | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `"http://localhost:4000"` (dev) / `https://sync-api.up.railway.app` (prod) | Target NestJS API URL (inlined at build time) |

---

## 6. Pre-Seeded Demo Accounts (Golden Path)

All seeded test accounts share the initial password: **`Demo123!`**

| Persona / Role | Email | Division Scope | Key Capabilities & Evaluation Focus |
|---|---|---|---|
| **Super Admin** | `admin@cakrawala.ac.id` | Operations (Global) | User provisioning, RBAC matrix, division orphan warnings, system security settings |
| **Operations Coordinator** | `coordinator@cakrawala.ac.id` | Operations | Cross-division portfolio oversight, task assignment, approval routing |
| **Division PIC (Acara)** | `pic.acara@cakrawala.ac.id` | Acara | Upload Grand Summit meeting note, manage Acara tasks, vendor POs |
| **Division PIC (Logistics)**| `pic.logistics@cakrawala.ac.id` | Logistics | Conflict intervention (duplicate vendor merge), view auto-generated tasks |
| **Reviewer** | `reviewer1@cakrawala.ac.id` | Operations | Review queue, edit proposed items, approve extraction to trigger Logistics task |
| **Approver** | `approver1@cakrawala.ac.id` | Finance | Approval Center, inspection of multi-step chain, return for revision |
| **Viewer / Auditor** | `viewer1@cakrawala.ac.id` | Operations | Read-only operational state, comprehensive immutable audit trail |

---

## 7. Role-Based Access Control (RBAC) & Scoping

The system pairs **6 Protected System Roles** with **16 Granular Permissions**:

```
User ──► Role ──► Permissions
  └────► Division Scope ──► Data Isolation Filter
```

- **Super Admin**: Full administrative authority (`admin:*`, `audit:view`, user & division management).
- **Operations Coordinator**: Cross-division read/write capability across all programs, tasks, and conflicts.
- **Division PIC**: Scoped to assigned division (`divisionId == user.divisionId`); cannot see or mutate other divisions' internal drafts.
- **Reviewer**: Evaluates submitted documents and validates human-in-the-loop extractions.
- **Approver**: Authorized to decide consequential approval steps.
- **Viewer / Auditor**: Read-only oversight of operational progress and immutable audit trails.

---

## 8. Golden Demo Walkthrough (Replicating Case Study)

Follow these steps to demonstrate the resolution of the three core failure modes:

1. **Sign In**:
   - Navigate to `http://localhost:3000/login`.
   - Sign in as **PIC Acara** (`pic.acara@cakrawala.ac.id` / `Demo123!`).
2. **Dashboard Overview**:
   - Observe the 4 KPI cards (Program Aktif, Persetujuan, Konflik, Terlambat).
   - Review the *Program Operasional* progress bars and *Perlu Perhatian* exceptions.
3. **Upload Operational Document (Failure Mode 1 Resolution)**:
   - Navigate to **Document Center** (`/documents`).
   - Click **Upload** and submit a meeting note (e.g. `grand-summit-meeting-notes.md`).
   - Click into the document detail and click **Submit for review**.
4. **Human-in-the-Loop Review**:
   - Sign out and sign in as **Reviewer** (`reviewer1@cakrawala.ac.id` / `Demo123!`).
   - Open **Review Queue** (`/reviews`).
   - Open the submitted document review, edit proposed parameters if desired, and click **Approve**.
   - *Result*: Document status advances to `APPROVED`, proposals become confirmed, and **a new task for Logistics is automatically generated** in the backlog.
5. **Resolve Duplicate Vendor Order (Failure Mode 3 Resolution)**:
   - Sign out and sign in as **PIC Logistics** (`pic.logistics@cakrawala.ac.id` / `Demo123!`).
   - Open **Conflict Center** (`/conflicts`).
   - Click **Tinjau** on *Potensi Pemesanan Ganda (Vendor ABC)*.
   - Inspect side-by-side comparison (Logistik 100 units vs Acara 150 units).
   - Click **Gabungkan Pesanan (Merge)** with notes to consolidate into a single PO.
6. **Break Approval Bottlenecks (Failure Mode 2 Resolution)**:
   - Sign out and sign in as **Approver** (`approver1@cakrawala.ac.id` / `Demo123!`).
   - Open **Persetujuan** (`/approvals`).
   - Click **Intervensi PIC / Review** on *Proposal Sponsorship*.
   - Inspect the visual 3-stage chain (PIC → Finance → Director).
   - Enter revision notes and click **Kembalikan untuk Revisi (Return)**.
7. **Traceability & Audit Verification**:
   - Open **Audit Trail** (`/audit`).
   - Verify that every login, upload, review approval, task creation, conflict resolution, and approval return is immutably logged with actor and timestamp.

---

## 9. Super Admin Administration Suite

Accessible only to accounts with `admin:*` permissions:
- **/admin**: Administration control hub overview with platform health stats.
- **/admin/users**: Account provisioning with institutional email validation, role binding, division scoping, credential resets, and lifecycle status switches (Active / Suspended / Inactive).
- **/admin/roles**: Role & Permission Matrix for tuning capability boundaries with audit trails.
- **/admin/divisions**: Division registry with automated **Impact Analysis** preventing accidental orphaning of active users, programs, tasks, and documents upon deactivation.
- **/admin/system**: Global security settings (Google OIDC toggle, local auth toggle, allowed email domain restriction, upload size caps, and session timeouts).

---

## 10. Production Deployment: Vercel (Frontend) + Railway (API & PostgreSQL)

The production architecture separates the presentation layer from the persistent business service and relational storage:

```
┌───────────────────────────────────────────────────────────┐
│ Vercel (Frontend UI)                                      │
│ • Next.js 15 (App Router, Server Components & Client UI) │
│ • Environment: NEXT_PUBLIC_API_URL                        │
│ • URL: https://<project>.vercel.app                       │
└─────────────────────────────┬─────────────────────────────┘
                              │
                              │ Cross-Origin HTTPS (credentials: include)
                              │ Cookie: SameSite=None; Secure; Partitioned
                              ▼
┌───────────────────────────────────────────────────────────┐
│ Railway (API Service)                                     │
│ • NestJS 11 REST API via Nixpacks (railway.json)          │
│ • Environment: DATABASE_URL, WEB_ORIGIN, SESSION_SECRET   │
│ • URL: https://<service>.up.railway.app                   │
└─────────────────────────────┬─────────────────────────────┘
                              │
                              │ Managed TCP Connection (Port 5432)
                              ▼
┌───────────────────────────────────────────────────────────┐
│ Railway (Managed PostgreSQL)                              │
│ • Prisma ORM with automated migrations on boot            │
│ • Persistent relational storage across deploys            │
└───────────────────────────────────────────────────────────┘
```

### Step-by-Step Connection Guide

#### Phase 1 — Database Setup on Railway (PostgreSQL)
1. Open your project on [Railway](https://railway.app).
2. Click **`+ New`** → Select **`Database`** → **`Add PostgreSQL`**.
3. Railway provisions a high-availability PostgreSQL cluster and automatically populates `DATABASE_URL`.

#### Phase 2 — API Service Setup on Railway (`sync-api`)
1. In the same Railway project canvas, click **`+ New`** → **`GitHub Repo`** → Select `sync-cakrawala`.
2. Configure **Settings**:
   - **Root Directory**: leave as `/` (monorepo root).
   - **Build Command**: auto-configured via [`railway.json`](file:///c:/Users/muhas/Desktop/WORK%20Projects/sync-cakrawala/railway.json):
     ```bash
     npx prisma generate --schema=apps/api/prisma/schema.prisma && npm run build -w @sync/shared && npm run build -w @sync/api
     ```
   - **Start Command**: auto-configured via [`railway.json`](file:///c:/Users/muhas/Desktop/WORK%20Projects/sync-cakrawala/railway.json):
     ```bash
     npm run start:migrate -w @sync/api
     ```
     *(Runs `prisma migrate deploy` before launching NestJS on `$PORT`)*.
3. Configure **Variables** in Railway API Service:
   - `DATABASE_URL`: Set to `${{Postgres.DATABASE_URL}}` (or copy PostgreSQL connection string).
   - `WEB_ORIGIN`: Set to your Vercel frontend URL, e.g. `https://sync-cakrawala.vercel.app` (multiple comma-separated URLs or wildcard `*.vercel.app` are supported).
   - `SESSION_SECRET`: Set to a strong secret string (e.g. `openssl rand -hex 32`).
   - `COOKIE_SAME_SITE`: Set to `none` (auto-detected in production).
   - `COOKIE_SECURE`: Set to `true` (auto-detected in production).
4. Under **Networking**, click **`Generate Domain`** to get your public API URL (e.g. `https://sync-api-production.up.railway.app`).

#### Phase 3 — Frontend Setup on Vercel (`sync-web`)
1. Open [Vercel](https://vercel.com) → Click **`Add New...`** → **`Project`**.
2. Import your `sync-cakrawala` GitHub repository.
3. Configure Project Settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click **Edit** and choose `apps/web`.
   - **Build Command**: `npm run build` (Next.js automatically transpiles `@sync/shared` via `next.config.js`).
4. Configure **Environment Variables** on Vercel:
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: `https://sync-api-production.up.railway.app` *(use your Railway domain without trailing slash)*
   - Environments: check **Production**, **Preview**, and **Development**.
5. Click **Deploy**.

#### Phase 4 — Verifying Cross-Origin Communication
1. Open your deployed Vercel URL (`https://<project>.vercel.app`).
2. Open Browser DevTools → **Network** tab.
3. Sign in with evaluator credentials (`admin@cakrawala.ac.id` / `Demo123!`).
4. Verify:
   - `POST /auth/login` returns HTTP 200 with response header `set-cookie: sync.sid=...; SameSite=None; Secure; HttpOnly`.
   - Subsequent request `GET /users/me` automatically includes the `Cookie: sync.sid=...` header.
   - User is redirected to `/dashboard` seamlessly.

---

## 11. Known Limitations & Production Notes

- **Object Storage Driver**: Uploaded files default to `STORAGE_DRIVER="local"`. In a stateless container environment, configure `STORAGE_DRIVER="s3"` with AWS S3 or Cloudflare R2 bucket credentials for durable asset storage across restarts.
- **Third-Party Cookies vs Custom Domains**: While `SameSite=None; Secure` is fully supported across modern browsers, setting up custom subdomains on a shared apex (e.g. `app.cakrawala.ac.id` on Vercel and `api.cakrawala.ac.id` on Railway) makes session cookies **first-party**, avoiding any aggressive browser tracking prevention blockers.

---

## 12. Verification & Testing

Run the full verification suite locally:

```bash
# 1. Monorepo Full Build
cmd /c "npm run build -w @sync/shared && npm run build -w @sync/api && npm run build -w @sync/web"

# 2. Database Migration & Seeding
npm run db:generate
npm run db:migrate
npm run db:seed

# 3. Development Mode
npm run dev
```

---

*Developed for SGA Cakrawala • Ristek Frontend Engineering Track*
