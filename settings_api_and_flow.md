# SYNC Cakrawala: Settings, API, and Flow Architecture

**Product**: SYNC Cakrawala (Revision 3.2 Master Plan Baseline)  
**System Architecture**: Monorepo with Next.js App Router (Frontend on Vercel) + NestJS (Backend on Railway) + Prisma ORM + PostgreSQL (Railway) + Object Storage (Local/S3 compatible)

---

## 1. Settings

### 1.1 Configuration & Environment Variables

| Variable | Scope | Default | Description |
|---|---|---|---|
| `PORT` | Backend | `4000` | Port for NestJS REST API server (dynamic `$PORT` on Railway) |
| `DATABASE_URL` | Backend | `postgresql://...` | PostgreSQL database connection string (`${{Postgres.DATABASE_URL}}` on Railway) |
| `SESSION_SECRET` | Backend | `change-me-in-production` | Secret key used for signing session cookies |
| `WEB_ORIGIN` | Backend | `http://localhost:3000` | Allowed CORS origin (comma-separated or wildcard for Vercel domains) |
| `COOKIE_SAME_SITE` | Backend | `lax` (dev) / `none` (prod)| Cookie SameSite attribute (`none` required for cross-site Vercel to Railway) |
| `COOKIE_SECURE` | Backend | `false` (dev) / `true` (prod)| Require HTTPS for session cookies |
| `STORAGE_DRIVER` | Backend | `local` | Storage driver (`local` or `s3`) |
| `STORAGE_LOCAL_PATH` | Backend | `./storage` | Directory path for local binary storage |
| `GOOGLE_OIDC_ENABLED`| Backend | `false` | Enable/disable Google Workspace OIDC |
| `GOOGLE_CLIENT_ID` | Backend | `""` | Google Cloud OAuth2 Client ID |
| `GOOGLE_CLIENT_SECRET`| Backend | `""` | Google Cloud OAuth2 Client Secret |
| `GOOGLE_REDIRECT_URI`| Backend | `http://localhost:4000/auth/google/callback` | OAuth2 callback redirect URL |
| `ALLOWED_EMAIL_DOMAIN`| Backend | `cakrawala.ac.id` | Hosted domain claim validator for OIDC & local emails |
| `NEXT_PUBLIC_API_URL`| Frontend | `http://localhost:4000` | Public backend API URL consumed by Vercel client |

### 1.2 System Settings Model (`SystemSettings`)

| Setting Key | Type | Default | Managed By | Description |
|---|---|---|---|---|
| `googleOidcEnabled` | Boolean | `false` | Super Admin | Toggles Google Workspace OIDC single sign-on |
| `localAuthEnabled` | Boolean | `true` | Super Admin | Enables local email/password authentication |
| `allowedEmailDomain` | String | `cakrawala.ac.id` | Super Admin | Restricts accounts to official institution emails |
| `maxUploadBytes` | Number | `10485760` (10MB) | Super Admin | Maximum binary upload file size in bytes |
| `sessionTimeoutMinutes` | Number | `480` (8h) | Super Admin | Inactivity duration before session invalidation |
| `requireFirstLoginChange` | Boolean | `true` | Super Admin | Forces credential rotation upon initial local login |

### 1.3 RBAC Permissions Matrix

The 6 system personas enforce Least Privilege across 16 core granular permissions:

| Permission Code | Capability Description | Admin | Coordinator | Division PIC | Reviewer | Approver | Viewer |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `dashboard:view` | Access operational dashboard & KPIs | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `programs:view_all` | View programs across all 8 divisions | ✓ | ✓ | - | ✓ | - | - |
| `programs:view_scoped` | View programs restricted to division scope | - | - | ✓ | - | ✓ | ✓ |
| `tasks:create` | Create new operational tasks | - | ✓ | ✓ | - | - | - |
| `tasks:assign` | Assign tasks to division members | - | ✓ | ✓ | - | - | - |
| `tasks:update` | Transition task status in Kanban board | - | ✓ | ✓ | - | - | - |
| `documents:upload` | Upload operational documents (.pdf, .docx, etc.) | ✓ | ✓ | ✓ | ✓ | ✓ | - |
| `documents:review` | Review proposed extractions & approve/return | ✓ | ✓ | - | ✓ | ✓ | - |
| `approvals:decide` | Decide consequential approvals (approve/return/reject) | ✓ | ✓ | - | - | ✓ | - |
| `conflicts:resolve` | Intervene and resolve cross-division conflicts | ✓ | ✓ | ✓ | - | - | - |
| `audit:view` | Inspect full platform audit trail | ✓ | ✓ | - | ✓ | ✓ | ✓ |
| `audit:view_scoped` | Inspect own audit trail events | - | - | ✓ | - | - | - |
| `admin:users` | Provision and manage user accounts | ✓ | - | - | - | - | - |
| `admin:roles` | Fine-tune role permission assignments | ✓ | - | - | - | - | - |
| `admin:divisions` | Manage divisions & view orphan impact | ✓ | - | - | - | - | - |
| `admin:system` | Configure global system & security policy | ✓ | - | - | - | - | - |

---

## 2. API Specifications

All endpoints are hosted at `http://localhost:4000` (or `PORT`).

### 2.1 Authentication Endpoints (`/auth`)

#### `POST /auth/login`
- **Description**: Authenticate with email or NIM/username local credentials.
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  { "email": "admin@cakrawala.ac.id", "password": "Demo123!" }
  ```
  *(Note: The `email` field accepts either institutional email address or NIM / username, e.g., `"admin"`, `"prayudha"`, `"coordinator"`).*
- **Response** (`200 OK`):
  ```json
  {
    "id": "cuid-123",
    "email": "admin@cakrawala.ac.id",
    "fullName": "Super Admin",
    "mustChangePassword": false
  }
  ```
- **Cookies Set**: `sync.sid` (HTTP-only, SameSite: Lax)

#### `POST /auth/logout`
- **Description**: Invalidate authenticated session cookie.
- **Response** (`200 OK`): `{ "success": true }`

#### `POST /auth/change-password`
- **Description**: Rotate user password; mandatory on first login if flagged.
- **Request Body**:
  ```json
  { "currentPassword": "OldPassword123!", "newPassword": "NewSecurePassword123!" }
  ```
- **Response** (`200 OK`): `{ "success": true }`

#### `POST /auth/request-password-reset`
- **Description**: Initiate self-service or evaluator password reset workflow.
- **Request Body**: `{ "email": "user@cakrawala.ac.id" }`
- **Response** (`200 OK`): `{ "success": true, "message": "Password reset request recorded." }`

#### `GET /auth/google/info`
- **Description**: Returns OIDC status, allowed domain, and evaluator guidance.
- **Response** (`200 OK`):
  ```json
  {
    "enabled": false,
    "domain": "cakrawala.ac.id",
    "message": "Google OIDC is not configured. Use a local demo account."
  }
  ```

#### `GET /health`
- **Description**: Basic liveness and service health probe.
- **Response** (`200 OK`): `{ "status": "ok", "service": "sync-api", "timestamp": "2026-09-21T09:35:02.684Z" }`

#### `GET /`
- **Description**: Root service indicator directing developers and evaluators to the web frontend application.
- **Response** (`200 OK`):
  ```json
  {
    "service": "SYNC Cakrawala Backend API",
    "status": "online",
    "webUrl": "http://localhost:3000",
    "message": "This is the backend REST API. Open http://localhost:3000 to access the SYNC Cakrawala web interface."
  }
  ```

---

### 2.2 Current User Context (`/users`)

#### `GET /users/me`
- **Description**: Returns authenticated session identity, role, division scope, and effective permissions.
- **Response** (`200 OK`):
  ```json
  {
    "id": "cuid-user",
    "fullName": "Super Admin",
    "email": "admin@cakrawala.ac.id",
    "status": "ACTIVE",
    "mustChangePassword": false,
    "role": { "id": "role-1", "code": "SUPER_ADMIN", "name": "Super Admin" },
    "division": { "id": "div-1", "code": "OPERATIONS", "name": "Operations" },
    "permissions": ["dashboard:view", "admin:users", "admin:roles", "admin:divisions", "admin:system"]
  }
  ```

#### `PATCH /users/me`
- **Description**: Updates non-privileged user preferences (theme, density, timezone, notification subscriptions).

---

### 2.3 Administration Endpoints (`/admin`)

#### `GET /admin/users`
- **Permission**: `admin:users`
- **Query Params**: `q` (string, filter), `status` (string)
- **Response** (`200 OK`): List of user accounts with roles and divisions.

#### `POST /admin/users`
- **Permission**: `admin:users`
- **Request Body**:
  ```json
  {
    "fullName": "Budi Logistik",
    "email": "budi.logistik@cakrawala.ac.id",
    "roleId": "cuid-role",
    "divisionId": "cuid-div",
    "authProvider": "LOCAL",
    "password": "Demo123!",
    "mustChangePassword": true
  }
  ```

#### `GET /admin/users/:id`
- **Permission**: `admin:users`
- **Response** (`200 OK`): Single user details with role and division.

#### `PATCH /admin/users/:id`
- **Permission**: `admin:users`
- **Request Body**: `{ "fullName": "Updated Name", "roleId": "...", "status": "ACTIVE" }`

#### `POST /admin/users/:id/status`
- **Permission**: `admin:users`
- **Request Body**: `{ "status": "ACTIVE" | "INACTIVE" | "SUSPENDED" }`

#### `POST /admin/users/:id/reset-password`
- **Permission**: `admin:users`
- **Response** (`200 OK`): `{ "success": true, "temporaryPassword": "TempPass123!" }`

#### `GET /admin/roles` & `PATCH /admin/roles/:id`
- **Permission**: `admin:roles`
- **Description**: View all 6 roles and mutate role permission arrays with confirmation and audit.

#### `GET /admin/divisions` & `POST /admin/divisions`
- **Permission**: `admin:divisions`
- **Description**: List divisions with related entity counts and register new divisions.

#### `GET /admin/divisions/:id/impact`
- **Permission**: `admin:divisions`
- **Description**: Returns count of users, programs, tasks, and documents that would be affected by deactivation.

#### `GET /admin/system-settings` & `PATCH /admin/system-settings`
- **Permission**: `admin:system`
- **Description**: Retrieve and configure institutional domain, upload sizes, timeouts, and auth methods.

---

### 2.4 Operational Endpoints

| Endpoint | Method | Permission Guard | Description |
|---|---|---|---|
| `/dashboard` | `GET` | `dashboard:view` | Aggregates KPIs, program progress, attention alerts, and audit feed |
| `/programs` | `GET`, `POST` | `dashboard:view` | Cross-division program list & creation |
| `/tasks` | `GET`, `POST` | `dashboard:view` | Kanban board tasks with division scoping |
| `/tasks/:id` | `PATCH` | `tasks:update` | Update task status, assignee, or priority |
| `/documents` | `GET` | `dashboard:view` | Document repository with version and review counts |
| `/documents/upload` | `POST` | `documents:upload` | Multipart file upload with MIME/extension validation |
| `/documents/:id/submit` | `POST` | `documents:upload` | Submits document to processing & triggers stub extraction |
| `/reviews` | `GET` | `documents:review` | Review queue prioritized by submission age and risk |
| `/reviews/:id/approve` | `POST` | `documents:review` | Approves extraction, marks confirmed, creates Logistics task |
| `/reviews/:id/return` | `POST` | `documents:review` | Returns extraction to author with required comment |
| `/reviews/:id/reject` | `POST` | `documents:review` | Rejects extraction terminal state |
| `/approvals` | `GET`, `POST` | `dashboard:view` | List multi-step approval cards with budget & chain |
| `/approvals/:id/approve` | `POST` | `approvals:decide` | Advances current step or completes approval |
| `/approvals/:id/return` | `POST` | `approvals:decide` | Returns approval to previous/requester state |
| `/approvals/:id/reject` | `POST` | `approvals:decide` | Rejects approval request |
| `/conflicts` | `GET` | `dashboard:view` | List cross-division conflicts with severity dots |
| `/conflicts/:id/resolve` | `POST` | `conflicts:resolve` | Resolves conflict (`MERGE`, `KEEP_SEPARATE`, `DISMISS`) |
| `/audit` | `GET` | `audit:view` | Paginated immutable operational log with actor filters |

---

## 3. End-to-End Operational Flow

```
[ Frontend: React / Next.js ]
              │
              ▼  (HTTP with credentials: true)
[ NestJS Boundary: Guards & Interceptors ]
  ├── RequestIdInterceptor (Tags every request with x-request-id)
  ├── AuthGuard (Validates session.userId in express-session)
  ├── PermissionsGuard (Checks user permissions vs @RequirePermissions)
  └── ValidationPipe (Validates DTO whitelist and type safety)
              │
              ▼
[ Application Services ]
  ├── AuthService: Hashes passwords with bcrypt, checks account status
  ├── AdminService: Enforces non-destructive division checks, audits changes
  ├── DocumentsService: Validates MIME/extension, writes to storage, creates DRAFT
  ├── ReviewsService: Implements Human-in-the-Loop, generates Logistics tasks
  ├── ApprovalsService: Steps through sequential approver chain
  └── ConflictsService: Side-by-side reconciliation & resolution notes
              │
              ▼
[ Persistence Layer: Prisma ORM + PostgreSQL on Railway ]
  ├── PostgreSQL Service (Users, Roles, Permissions, Divisions, Tasks, Documents, Approvals, Conflicts)
  └── storage/ (Local binary files stored by hash/UUID or S3 driver)
              │
              ▼
[ Audit Trail Service ]
  └── Logs actorId, action, entityType, entityId, oldValue, newValue
```

---

## 4. Case Study Failure Mode Mappings & Golden Demo

| Case Study Problem | Root Cause Identified | SYNC Cakrawala Solution |
|---|---|---|
| **Audio/Stage Spec Desync** | Spec changes trapped in meeting notes; Logistics vendor unaware. | Document Center uploads note; extractor proposes spec; Reviewer approves; **Logistics task is automatically created** with deadline and traceability. |
| **Sponsorship Bottleneck** | Proposal stalled 3 weeks waiting for unassigned approver. | Approval Center displays **visual 3-stage chain** (PIC -> Finance -> Director); current actor and SLA age are visible; explicit Return with reason. |
| **Duplicate Vendor Orders** | Acara & Logistics order same vendor on same day independently. | Conflict Center flags **Potensi Pemesanan Ganda**; displays side-by-side order comparison (100 unit vs 150 unit); PIC executes **Gabungkan Pesanan (Merge)**. |

---

## 5. Security & Operations Baseline

1. **Authentication Security**:
   - Passwords hashed using `bcrypt` (12 rounds).
   - Session cookies configured `httpOnly: true`, `sameSite: 'none'` (in production cross-origin mode) / `'lax'` (in local dev), `secure: true` (in production HTTPS), `maxAge: 8 hours`.
   - Express reverse proxy support: `trust proxy: 1` enabled for Railway TLS termination.
   - Rate limiting via `@nestjs/throttler` (10 login attempts/min).
2. **Authorization & Least Privilege**:
   - Division scope enforced on all data queries (`divisionId: user.divisionId` for scoped roles).
   - Server-side validation authority; client cannot tamper with role or permissions.
3. **File Upload Security**:
   - Allowed extensions strictly whitelisted: `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.csv`, `.ppt`, `.pptx`, `.txt`, `.md`, `.jpg`, `.jpeg`, `.png`, `.webp`.
   - Blocked extensions rejected immediately: `.exe`, `.bat`, `.cmd`, `.sh`, `.ps1`, `.dll`, `.js`.
   - Storage keys decoupled from user-supplied file names to prevent directory traversal.
4. **Auditability**:
   - Every state transition across users, roles, divisions, documents, reviews, tasks, approvals, and conflicts generates an immutable `AuditLog` row.

---

## 6. Deployment & Cloud Hosting (Vercel Frontend + Railway API & PostgreSQL)

### 6.1 Production Architecture

```
[ Vercel: Next.js 15 Web App ]
         │ (Cross-Origin HTTPS, credentials: 'include')
         ▼
[ Railway: NestJS 11 REST API ] (via railway.json Nixpacks)
         │ (Prisma Client over TCP/SSL)
         ▼
[ Railway: Managed PostgreSQL Database ]
```

### 6.2 Service Configuration Matrix

#### Service 1: Railway Managed PostgreSQL
- Provisioned via Railway canvas (**`+ New`** → **`Database`** → **`PostgreSQL`**).
- Connection string available internally via `${{Postgres.DATABASE_URL}}`.

#### Service 2: Railway NestJS API Service (`sync-api`)
- **Nixpacks Configuration** (`railway.json`):
  - `build.buildCommand`: `npx prisma generate --schema=apps/api/prisma/schema.prisma && npm run build -w @sync/shared && npm run build -w @sync/api`
  - `deploy.startCommand`: `npm run start:migrate -w @sync/api`
- **Environment Variables**:
  - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}`
  - `PORT`: (Auto-assigned by Railway)
  - `WEB_ORIGIN`: `https://<your-vercel-app>.vercel.app` (supports comma-separated list or `*.vercel.app`)
  - `SESSION_SECRET`: Random 32+ character string
  - `COOKIE_SAME_SITE`: `none` (auto-detected in production)
  - `COOKIE_SECURE`: `true` (auto-detected in production)

#### Service 3: Vercel Web Application (`sync-web`)
- **Framework Preset**: `Next.js`
- **Root Directory**: `apps/web`
- **Build Command**: `npm run build` (transpiles `@sync/shared` automatically via `next.config.js`)
- **Environment Variables**:
  - `NEXT_PUBLIC_API_URL`: `https://<your-railway-api>.up.railway.app` (Railway public domain, no trailing slash)

---

## 7. Mobile UI/UX & Safari ITP Architecture

### 7.1 WebKit ITP & First-Party Proxy Rewrite
Apple's WebKit **Intelligent Tracking Prevention (ITP)** on iOS Safari blocks third-party cross-site cookies between differing domains (`*.vercel.app` and `*.up.railway.app`) by default. To guarantee 100% reliable session persistence across all iOS and Android mobile browsers without requiring users to disable tracking prevention:
- **Next.js Rewrites (`apps/web/next.config.js`)**:
  ```js
  async rewrites() {
    return [
      {
        source: '/api-proxy/:path*',
        destination: `${publicApiUrl.replace(/\/+$/, '')}/:path*`,
      },
    ];
  }
  ```
- **Client Route Dispatcher (`apps/web/src/lib/api.ts`)**:
  Browser client requests in deployed environments automatically target `/api-proxy`, converting `sync.sid` into a First-Party cookie tied to the Vercel domain.

### 7.2 Mobile Responsive Design System
- **AppShell Header & Drawer**:
  - Mobile header features an accessible 44px SVG hamburger menu button.
  - User details collapse on mobile viewports into a circular avatar trigger (`Initials`) that opens an interactive popover with account details, Profile, Settings, and Sign out.
  - Slide-out navigation drawer includes an explicit close (`✕`) button, touch-spaced navigation links, and a dedicated user identity footer.
- **Form Controls & iOS Safari Auto-Zoom Prevention**:
  - All form controls (`Input`, `Select`, `Textarea`) use `text-base sm:text-sm` (16px font size on mobile viewports), completely eliminating iOS Safari's disruptive viewport auto-zoom upon focus.
- **Touch-Friendly Data & Grid Layouts**:
  - 4-column Kanban board in `Tasks` supports horizontal swipe with momentum and scroll snapping (`snap-x snap-mandatory`).
  - Side-by-side comparison cards in `Conflicts` automatically stack vertically on small viewports (`grid-cols-1 sm:grid-cols-2`).
  - Multi-step approval chains in `Approvals` support horizontal touch scrolling (`overflow-x-auto pb-2`).
  - All tabular records (`Documents`, `Reviews`, `Audit`, `Users`, `Divisions`) are wrapped in `overflow-x-auto` containers with explicit minimum column widths, preventing content truncation on mobile screens.

