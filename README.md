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
                                    ▼ HTTP (Port 3000)
                     ┌──────────────────────────────┐
                     │     Next.js / React 19       │
                     │  Tailwind CSS Design System  │
                     │   App Router (/dashboard,    │
                     │    /tasks, /approvals, etc.) │
                     └──────────────┬───────────────┘
                                    │
                                    ▼ REST / JSON (Credentials: Include)
                     ┌──────────────────────────────┐
                     │       NestJS 11 REST API     │
                     │         (Port 4000)          │
                     ├──────────────────────────────┤
                     │ Guards: Auth, RBAC, Division │
                     │ Interceptors: Request ID     │
                     │ Filters: Safe HttpException  │
                     └──────────────┬───────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
       ┌────────────────────────┐      ┌────────────────────────┐
       │   Prisma ORM + SQLite  │      │  Binary Object Storage │
       │ (Users, Roles, Tasks,  │      │ (Local Disk / S3 Blob) │
       │  Docs, Approvals, etc) │      │ (Safe UUID Keyed MIME) │
       └────────────────────────┘      └────────────────────────┘
```

---

## 3. Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS.
- **Backend**: NestJS 11, Express, Class-Validator, Class-Transformer.
- **Data & ORM**: Prisma ORM 6, SQLite (`dev.db`).
- **Identity & Session**: Google Workspace OIDC + Scoped Local Authentication (`express-session` with HTTP-only cookies and bcrypt password hashing).
- **Design Tokens**: Cakrawala Navy (`#16324F`), Cakrawala Teal (`#087EA4`), Light Cyan (`#DDF3F8`), Success (`#18A874`), Warning (`#F4A62A`), Danger (`#EF6A6A`), Surface (`#F3F8FC`), Border (`#DCE7EF`).

---

## 4. Local Development Setup

### Prerequisites
- Node.js >= 20
- npm >= 10

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
   cp apps/web/.env.local.example apps/web/.env.local  # or use defaults
   ```

4. **Run database migration & seed demo dataset**:
   ```bash
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

### Backend (`apps/api/.env`)
| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `4000` | NestJS HTTP Port |
| `DATABASE_URL` | `"file:./dev.db"` | SQLite database file connection string |
| `SESSION_SECRET` | `"change-me-in-production"` | Cookie signing secret |
| `WEB_ORIGIN` | `"http://localhost:3000"` | Allowed CORS origin |
| `STORAGE_DRIVER` | `"local"` | Binary driver: `local` or `s3` |
| `STORAGE_LOCAL_PATH`| `"./storage"` | Local uploaded files directory |
| `GOOGLE_OIDC_ENABLED`| `"false"` | Toggles Google Workspace OIDC |
| `GOOGLE_CLIENT_ID` | `""` | Google Cloud OAuth2 Client ID |
| `GOOGLE_CLIENT_SECRET`| `""` | Google Cloud OAuth2 Client Secret |
| `ALLOWED_EMAIL_DOMAIN`| `"cakrawala.ac.id"` | Required institutional email domain |

### Frontend (`apps/web/.env.local`)
| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `"http://localhost:4000"` | Target NestJS API URL |

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

## 10. Railway Cloud Deployment Plan

### Project Setup
1. Create a new Railway project with two services:
   - **`sync-api`**: Root directory `apps/api`, Build command `npm run build`, Start command `npm run start:prod`.
   - **`sync-web`**: Root directory `apps/web`, Build command `npm run build`, Start command `npm run start`.
2. Attach a persistent volume to `sync-api` at `/app/apps/api/prisma` (for SQLite `dev.db`) and `/app/apps/api/storage` (for uploaded documents).
3. Set environment variables in Railway dashboard according to Section 5.
4. Set `WEB_ORIGIN` in `sync-api` to the deployed `sync-web` domain (e.g. `https://sync-web.up.railway.app`).
5. Set `NEXT_PUBLIC_API_URL` in `sync-web` to the deployed `sync-api` domain.

---

## 11. Known Limitations

- **Single-Node SQLite Persistence**: Optimized for assignment evaluation and zero-ops deployment. For horizontal scaling across multiple Railway replicas, replace SQLite with PostgreSQL via Prisma provider switch.
- **Local Storage Driver**: Binaries are stored on local persistent disk. For production deployments with multiple API replicas, set `STORAGE_DRIVER="s3"` and supply AWS S3 / Cloudflare R2 credentials.

---

## 12. Verification & Testing

Run the full verification suite locally:

```bash
# 1. Typecheck & Build API
npm run build -w @sync/api

# 2. Typecheck & Build Web
npm run build -w @sync/web

# 3. Seed Database
npm run prisma:seed -w @sync/api
```

---

*Developed for SGA Cakrawala • Ristek Frontend Engineering Track*
