# ProjAxis - Project Progress & Build Checklist

Last updated: Build Complete & Verified

## Build Steps Status

- [x] **Step 1: Foundation**
  - Scaffold client (`projaxis-client`) and server (`projaxis-server`)
  - Environment variables and setup (`.env.example`, `.env`)
  - MongoDB connection with replica set & standalone fallback
  - Error handling, security middleware (Helmet, CORS, Rate Limit, Mongo Sanitize)
  - Zod validation middleware & API response formatting conventions
  - Design tokens (`#17365D`, `#2F65A7`, `#EAF2FB`, `#F5F7FA`, `#FFFFFF`, `#243247`, `#64748B`, `#DCE3EC`, `#27856A`, `#C58B24`, `#C94C4C`)
  - App layout & shared components (Sidebar, Topbar, Breadcrumbs, MetricCard, DataTable, FilterBar, StatusBadge, ProgressBar, Modal, FormField, EmptyState, Spinner, ConfirmDialog, Toast, FileUpload)
  - Counter and Settings models

- [x] **Step 2: Accounts & Authentication**
  - User model with embedded role profiles (Student, Guide, HOD, ReviewPanel)
  - Department model
  - Self-registration (Student, Guide, HOD pending approval)
  - JWT auth in httpOnly cookie (`SameSite=Lax`, 8-hour expiry)
  - `/api/auth/me`, login, logout, password change, forgot/reset password
  - Role-based routing, Access Denied screen
  - Admin user management & department management, approval of pending registrations
  - User Profile view & update

- [x] **Step 3: Proposals & Approvals**
  - ProjectProposal model with immutable snapshots (`versions[]`), `mentorChoices[]`, decision history
  - Proposal creation (Draft), Mentor selection (S2), Submit (S3)
  - HOD Guide Allocation (H3) with guide capacity cap (default 8)
  - Guide Review (G3, G4): Approve, Reject, Request Revision
  - HOD Topic Approval (H4): Guide Approved -> Approved, Rejected, Revision Required
  - Transactional Project creation on Topic Approval
  - My Projects list & Project Detail overview

- [x] **Step 4: Documents**
  - Document model with versioning (`versionGroupId`, `versionNumber`)
  - Secure Multer upload to `/uploads` with signature checking
  - Category support (Proposal, Report, Presentation, Source Code, Other)
  - Authorized download streaming
  - Version history UI and document attachment integration

- [x] **Step 5: Weekly Progress & Feedback**
  - ProgressReport model (one report per week, week starts Monday IST)
  - Late flag calculation
  - Guide Feedback (append-only with edit history)
  - Status transitions (Submitted, Reviewed, Needs Attention)
  - Final Project Submission (S4) workflow with final report validation

- [x] **Step 6: Project Workspace**
  - Workstream model & management
  - Milestone model & tracking
  - Task model (TSK-nnnn) with comments, attachments, priorities, dependencies
  - Kanban board with @dnd-kit + accessible "Move to" menu
  - Task list with filters + "Unscheduled" view
  - Timeline (CSS-grid Gantt) with overdue/blocking highlights
  - Team workload metrics & distribution
  - ActivityLog audit trail (append-only)
  - Calendar with derived events & custom meetings/presentations

- [x] **Step 7: Reviews & Evaluation**
  - Review model (Review 1, 2, 3, Final Viva, Guide Meeting)
  - Review scheduling (G7, H5, A5) with conflict validation & panel assignment
  - Attendance recording (G8) with Present/Absent/Excused
  - Evaluation model (rubric criteria scores per panel member)
  - Computed average panel scores and automated grade scale
  - Publish evaluation (H5) & student marks view (S10)

- [x] **Step 8: Notifications**
  - Real-time / event-driven in-app notifications
  - Topbar bell with unread badge & notifications drawer/page
  - node-cron reminders (weekly reports, 24h reviews, 48h tasks)
  - Admin system announcements
  - Nodemailer fallback logging

- [x] **Step 9: Dashboards & Reports**
  - Student Dashboard (progress, deadlines, reviews, notifications)
  - Guide Dashboard (teams, pending proposals, reports, reviews)
  - HOD Department Dashboard (department stats, allocations, approvals)
  - Review Panel Dashboard (assigned reviews, pending evaluations)
  - Admin Dashboard (system stats, users, departments, activity)
  - Department & System Reports with CSV export and print-friendly PDF

- [x] **Step 10: Admin Configuration**
  - Settings management (deadlines, rubric, grade scale, capacity cap, file limits, approval mode)
  - Project record management & review schedule oversight
  - Notification template & announcement controls

- [x] **Step 11: Hardening, Testing & Documentation**
  - Idempotent seed script (`npm run seed`) with comprehensive demo data
  - Automated tests (Jest/Supertest backend + Vitest frontend: 100% pass)
  - Security audit (RBAC, parameter tampering, department scoping)
  - Comprehensive documentation (`README.md`, `API.md`, `docs/use-case-coverage.md`, `docs/uml-coverage.md`, `docs/uiux/figma-to-code-map.md`, `.env.example`)

---

## Use Cases Coverage Checklist

### Student (S1 - S12)
- [x] S1 Register / log in
- [x] S2 Add mentor (choose preferred guide)
- [x] S3 Abstract submission (project proposal)
- [x] S4 Submit project (final submission)
- [x] S5 Upload project documents
- [x] S6 View guide feedback
- [x] S7 Track progress (status, weekly reports, timeline)
- [x] S8 View review schedule
- [x] S9 View attendance
- [x] S10 View marks and evaluation results (when published)
- [x] S11 Receive notifications and reminders
- [x] S12 Update own profile, change password

### Project Guide (G1 - G9)
- [x] G1 Register / log in
- [x] G2 View assigned student teams
- [x] G3 Review proposals
- [x] G4 Approve / reject / request revision on proposals
- [x] G5 Provide feedback
- [x] G6 Monitor students' weekly progress
- [x] G7 Schedule reviews
- [x] G8 Mark attendance
- [x] G9 Evaluate project progress

### HOD (H1 - H7)
- [x] H1 Register / log in
- [x] H2 Monitor all projects in department
- [x] H3 Assign guides to project teams
- [x] H4 Approve project topics
- [x] H5 Manage review activities
- [x] H6 Generate department-level reports
- [x] H7 Department dashboard

### Review Panel Member (P1 - P5)
- [x] P1 Log in
- [x] P2 View assigned projects and documents
- [x] P3 Conduct reviews (review details, attendance)
- [x] P4 Enter marks per rubric and add comments
- [x] P5 Submit final evaluation result

### Administrator (A1 - A8)
- [x] A1 Manage users
- [x] A2 Manage departments
- [x] A3 Manage roles and permissions
- [x] A4 Manage project records
- [x] A5 Manage review schedules
- [x] A6 Manage notifications
- [x] A7 Generate system reports
- [x] A8 Configure settings

### Project Workspace (PM1 - PM10)
- [x] PM1 Project summary (counters, progress, deadlines)
- [x] PM2 Tasks: create, edit, assign, prioritise, comment
- [x] PM3 Milestones
- [x] PM4 Workstreams
- [x] PM5 Task list with filters + "Unscheduled" view
- [x] PM6 Kanban board (5 columns + drag/drop + keyboard move)
- [x] PM7 Timeline (CSS-grid Gantt)
- [x] PM8 Team workload
- [x] PM9 Recent activity
- [x] PM10 Calendar (derived & custom events)
