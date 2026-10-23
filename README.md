# ProjAxis - College Project Management Platform (MERN)

**ProjAxis** is a role-based, institutional project management platform designed for engineering and degree colleges. It centralizes proposal submission, guide allocation, two-tier topic approval, document versioning, weekly progress reporting, review scheduling, attendance tracking, rubric-based evaluation, and institutional reporting.

---

## 1. Quick Start

### Prerequisites
- **Node.js**: v20+
- **MongoDB**: v6+ or v7+ (Community or Enterprise Server)
- **Package Manager**: `npm`

### Environment Variables
Copy `.env.example` in both server and client:
```bash
# Server configuration
cp server/.env.example server/.env

# Client configuration
cp client/.env.example client/.env
```

Key environment variables in `server/.env`:
- `PORT=5000`
- `NODE_ENV=development`
- `MONGO_URI=mongodb://127.0.0.1:27017/projaxis`
- `JWT_SECRET=projaxis_super_secret_jwt_key_2026_academic_inst`
- `COOKIE_SECRET=projaxis_cookie_secret_key_2026`
- `TZ=Asia/Kolkata`

### Installation & Database Seeding
```bash
# 1. Install dependencies
cd server && npm install
cd ../client && npm install

# 2. Seed database with demo accounts & academic records
cd ../server
npm run seed
```

### Running Locally
Open two terminal windows:
```bash
# Terminal 1: Start Server (API running on http://localhost:5000)
cd server
npm run dev

# Terminal 2: Start Client (Vite running on http://localhost:5173)
cd client
npm run dev
```

Visit **http://localhost:5173** to access the platform.

---

## 2. Seed Demo Accounts

All demo accounts share the password: `Password@123`

| Role | Email Address | Department | Notes / Supervised Scope |
|---|---|---|---|
| **Administrator** | `admin@projaxis.edu` | All | Full system configuration, user provisioning |
| **HOD (CSE)** | `hod.cse@projaxis.edu` | CSE | Guide allocation, topic approval, publish marks |
| **HOD (ECE)** | `hod.ece@projaxis.edu` | ECE | Department oversight for ECE |
| **Faculty Guide & Panel** | `guide.lovelace@projaxis.edu` | CSE | Supervises teams + Review Panel member |
| **Faculty Guide** | `guide.knuth@projaxis.edu` | CSE | Supervises active teams, schedules reviews |
| **Review Panel Member** | `panel.hopper@projaxis.edu` | CSE | Independent review evaluator, rubric scoring |
| **Student (Team Lead)** | `student1@projaxis.edu` | CSE | Registered to active project `PRJ-2026-0001` |
| **Student** | `student2@projaxis.edu` | CSE | Teammate on `PRJ-2026-0001` |
| **Student (Pending)** | `student4@projaxis.edu` | CSE | Proposal submitted, awaiting topic approval |

*Note: Quick demo login buttons are available directly on the login screen for one-click access.*

---

## 3. MongoDB & Replica Set Configuration

ProjAxis uses MongoDB transactions for multi-document operations (such as approving a topic and transactionally creating the active project workspace).

### Standalone Fallback
In development environments without a replica set, ProjAxis automatically detects standalone instances via `server/utils/transaction.js` (`withTransaction`) and gracefully executes operations directly.

### Setting Up a Local Single-Node Replica Set (Optional)
To enable native MongoDB replica set transactions locally on Windows/Linux:
```bash
# 1. Stop existing mongod service
net stop MongoDB

# 2. Start mongod with replSet flag
mongod --dbpath "C:\data\db" --replSet rs0 --port 27017

# 3. In mongosh, initiate replica set
mongosh --eval "rs.initiate()"
```

---

## 4. Architecture & Folder Structure

```
projaxis/
├── client/                     # React 18 + Vite Frontend
│   ├── src/
│   │   ├── api/                # Axios client with interceptors
│   │   ├── components/
│   │   │   ├── board/          # @dnd-kit Kanban with accessible menu
│   │   │   ├── common/         # StatusBadge, MetricCard, ProgressBar, Modal, DataTable
│   │   │   ├── layout/         # Sidebar, Topbar, Breadcrumbs
│   │   │   ├── projects/       # Summary, Workload, Activity, Milestones, Documents
│   │   │   ├── tasks/          # TaskList with Unscheduled view, TaskModal
│   │   │   └── timeline/       # Gantt CSS-grid with dependency highlights
│   │   ├── context/            # AuthContext with multi-role switcher
│   │   ├── pages/              # Public, Student, Guide, HOD, Panel, Admin pages
│   │   ├── routes/             # AppRoutes and ProtectedRoute (RBAC)
│   │   └── styles/             # tokens.css (official palette), index.css
│   └── tests/                  # Vitest UI test suite
├── server/                     # Node.js + Express Backend
│   ├── config/                 # DB connection and replica set detector
│   ├── controllers/            # Thin REST controllers
│   ├── middleware/             # Auth, RBAC, Multer magic-byte check, Error handling
│   ├── models/                 # Mongoose schemas with atomic Counter sequences
│   ├── routes/                 # Express routers with Zod validators
│   ├── services/               # Notification dispatcher & node-cron reminders
│   ├── tests/                  # Jest + Supertest integration test suite
│   └── seed/                   # Idempotent database seeder
├── docs/                       # Specifications, Coverage Matrix & UML
│   ├── use-case-coverage.md    # Mapping of all S1-S12, G1-G9, H1-H7, P1-P5, A1-A8, PM1-PM10
│   ├── uml-coverage.md         # Domain classes, methods, and relationships
│   ├── uiux/figma-to-code-map.md # UI/UX design tokens and responsive layout rules
│   └── postman_collection.json # Importable Postman API test collection
└── uploads/                    # Gitignored local secure file store
```

---

## 5. Automated Testing

### Backend Tests (Supertest + Jest)
```bash
cd server
npm test
```
*Result: 11 test suites passing (100% success).*

### Frontend Tests (Vitest + Testing Library)
```bash
cd client
npm test
```
*Result: 6 component and integration tests passing (100% success).*

### Production Build Verification
```bash
cd client
npm run build
```
*Result: 0 errors, production assets bundled into `client/dist`.*

---

## 6. Assumptions & Architectural Decisions

1. **Two-Tier Approval (Default):** Student proposals transition from `Draft` -> `Submitted` -> `With Guide` -> `Guide Approved` -> `Approved` (HOD sanction) -> `Active Project`. A single-tier mode (`Guide only`) can be selected in System Settings.
2. **Progress Calculations:** Project progress is strictly computed via aggregation:
   - *Task Progress*: `Done Tasks / Total Tasks`
   - *Reported Progress*: Latest weekly report percentage submitted by the team.
3. **Faculty Capacity Cap:** Default limit is 8 projects per faculty member. The HOD can override this cap during allocation by providing an explicit justification.
4. **Grading Scale Matrix:** Default criteria: 5 criteria x 10 marks (Total 50). Letter grade mapping: O (90%+), A+ (80-89%), A (70-79%), B+ (60-69%), B (50-59%), C (40-49%), Fail (<40%).
5. **Audit Trail:** Project activity logs are append-only and cannot be edited or deleted by any user role.

---

## 7. Troubleshooting

- **CORS or Cookie Issues in Development:** The server sets httpOnly cookies with `SameSite=Lax`. When testing via Postman, include the returned Bearer token in the `Authorization` header.
- **File Upload Errors:** Uploads require valid MIME signatures (magic bytes) matching `.pdf`, `.docx`, `.pptx`, `.zip`, `.png`, or `.jpg`. Files exceeding 10MB are rejected.
- **Port In Use (5000):** If port 5000 is occupied, set `PORT=5001` in `server/.env` and configure `client/vite.config.js` proxy accordingly.
