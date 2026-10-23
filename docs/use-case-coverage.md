# ProjAxis - Use Case Coverage Matrix

This document maps all 48 required use cases across the 5 user roles and the Project Workspace to their respective UI Page, Route, Backend API Endpoint, and Automated Test File.

---

## 1. Student Use Cases (`S1 - S12`)

| ID | Use Case | Frontend Component | Route | API Endpoint | Test File |
|---|---|---|---|---|---|
| **S1** | Register / log in | `Register.jsx`, `Login.jsx` | `/register`, `/login` | `POST /api/auth/register`<br>`POST /api/auth/login` | `server/tests/api.test.js`<br>`client/src/tests/app.test.jsx` |
| **S2** | Add mentor (choose preferred guide) | `AddMentor.jsx`, `SubmitProposal.jsx` | `/student/add-mentor`<br>`/student/submit-proposal` | `POST /api/proposals` (with `mentorChoices[]`) | `server/tests/api.test.js` |
| **S3** | Abstract submission (project proposal) | `SubmitProposal.jsx` | `/student/submit-proposal` | `POST /api/proposals`<br>`PATCH /api/proposals/:id/submit` | `server/tests/api.test.js` |
| **S4** | Submit project (final submission) | `FinalSubmission.jsx` | `/student/final-submission` | `POST /api/projects/:id/final-submission` | `server/tests/api.test.js` |
| **S5** | Upload project documents | `ProjectDocuments.jsx`, `FileUpload.jsx` | `/projects/:id` (Documents tab) | `POST /api/projects/:id/documents` | `server/tests/api.test.js` |
| **S6** | View guide feedback | `WorkspaceSummary.jsx`, `ProjectDetail.jsx` | `/projects/:id` | `GET /api/projects/:id/feedback`<br>`GET /api/progress/:id/reports` | `server/tests/api.test.js` |
| **S7** | Track progress (status, weekly reports, timeline) | `StudentDashboard.jsx`, `TimelineGantt.jsx` | `/student/dashboard`<br>`/projects/:id` | `GET /api/dashboard`<br>`GET /api/projects/:id/workspace` | `server/tests/api.test.js` |
| **S8** | View review schedule | `StudentReviews.jsx`, `CalendarPage.jsx` | `/student/reviews`<br>`/student/calendar` | `GET /api/reviews`<br>`GET /api/calendar/events` | `server/tests/api.test.js` |
| **S9** | View attendance | `StudentReviews.jsx` | `/student/reviews` | `GET /api/reviews/:id/attendance` | `server/tests/api.test.js` |
| **S10** | View marks and evaluation results (Published only) | `StudentReviews.jsx` | `/student/reviews` | `GET /api/evaluations/project/:projectId` | `server/tests/api.test.js` |
| **S11** | Receive notifications and reminders | `NotificationsPage.jsx`, `Topbar.jsx` | `/student/notifications` | `GET /api/notifications`<br>`PATCH /api/notifications/:id/read` | `server/tests/api.test.js` |
| **S12** | Update own profile, change password | `Profile.jsx`, `ChangePassword.jsx` | `/profile`<br>`/change-password` | `PATCH /api/auth/profile`<br>`POST /api/auth/change-password` | `server/tests/api.test.js` |

---

## 2. Project Guide Use Cases (`G1 - G9`)

| ID | Use Case | Frontend Component | Route | API Endpoint | Test File |
|---|---|---|---|---|---|
| **G1** | Register / log in | `Register.jsx`, `Login.jsx` | `/register`, `/login` | `POST /api/auth/register`<br>`POST /api/auth/login` | `server/tests/api.test.js` |
| **G2** | View assigned student teams | `MyTeams.jsx`, `GuideDashboard.jsx` | `/guide/teams`<br>`/guide/dashboard` | `GET /api/projects` | `server/tests/api.test.js` |
| **G3** | Review proposals | `ReviewProposals.jsx` | `/guide/proposals` | `GET /api/proposals` | `server/tests/api.test.js` |
| **G4** | Approve / reject / request revision on proposals | `ReviewProposals.jsx` | `/guide/proposals` | `POST /api/proposals/:id/guide-decision` | `server/tests/api.test.js` |
| **G5** | Provide feedback (proposals, reports, reviews) | `ProjectDetail.jsx`, `ReviewProposals.jsx` | `/projects/:id` | `POST /api/projects/:id/feedback`<br>`POST /api/progress/:id/feedback` | `server/tests/api.test.js` |
| **G6** | Monitor students' weekly progress | `GuideDashboard.jsx`, `TeamDetail.jsx` | `/guide/dashboard`<br>`/projects/:id` | `GET /api/progress/:id/reports` | `server/tests/api.test.js` |
| **G7** | Schedule reviews | `ScheduleReview.jsx` | `/guide/reviews` | `POST /api/reviews`<br>`PATCH /api/reviews/:id/reschedule` | `server/tests/api.test.js` |
| **G8** | Mark attendance | `ScheduleReview.jsx` (Attendance Modal) | `/guide/reviews` | `POST /api/reviews/:id/attendance` | `server/tests/api.test.js` |
| **G9** | Evaluate project progress | `ProjectDetail.jsx`, `TaskList.jsx` | `/projects/:id` | `PATCH /api/projects/:id/tasks/:taskId/status`<br>`POST /api/progress/:id/review` | `server/tests/api.test.js` |

---

## 3. HOD Use Cases (`H1 - H7`)

| ID | Use Case | Frontend Component | Route | API Endpoint | Test File |
|---|---|---|---|---|---|
| **H1** | Register / log in | `Register.jsx`, `Login.jsx` | `/register`, `/login` | `POST /api/auth/register`<br>`POST /api/auth/login` | `server/tests/api.test.js` |
| **H2** | Monitor all projects in department | `AllProjects.jsx`, `HodDashboard.jsx` | `/hod/projects`<br>`/hod/dashboard` | `GET /api/projects` | `server/tests/api.test.js` |
| **H3** | Assign guides to project teams | `GuideAllocation.jsx` | `/hod/allocations` | `POST /api/proposals/:id/assign-guide` | `server/tests/api.test.js` |
| **H4** | Approve project topics | `TopicApprovals.jsx` | `/hod/topic-approvals` | `POST /api/proposals/:id/hod-decision` | `server/tests/api.test.js` |
| **H5** | Manage review activities (assign panel, publish) | `ReviewManagement.jsx` | `/hod/reviews` | `PATCH /api/reviews/:id/assign-panel`<br>`POST /api/evaluations/:id/publish` | `server/tests/api.test.js` |
| **H6** | Generate department-level reports | `DepartmentReports.jsx` | `/hod/reports` | `GET /api/reports/:type`<br>`GET /api/reports/:type?format=csv` | `server/tests/api.test.js` |
| **H7** | Department dashboard | `HodDashboard.jsx` | `/hod/dashboard` | `GET /api/dashboard` | `server/tests/api.test.js` |

---

## 4. Review Panel Member Use Cases (`P1 - P5`)

| ID | Use Case | Frontend Component | Route | API Endpoint | Test File |
|---|---|---|---|---|---|
| **P1** | Log in | `Login.jsx` | `/login` | `POST /api/auth/login` | `server/tests/api.test.js` |
| **P2** | View assigned projects and documents | `AssignedReviews.jsx` | `/panel/assigned-projects` | `GET /api/reviews`<br>`GET /api/projects/:id/documents` | `server/tests/api.test.js` |
| **P3** | Conduct reviews (details & attendance) | `AssignedReviews.jsx` | `/panel/assigned-projects` | `GET /api/reviews/:id`<br>`GET /api/reviews/:id/attendance` | `server/tests/api.test.js` |
| **P4** | Enter marks per rubric and add comments | `EvaluationForm.jsx` | `/panel/evaluations/:reviewId` | `GET /api/reviews/:id/evaluation`<br>`POST /api/evaluations/:id/submit` | `server/tests/api.test.js` |
| **P5** | Submit final evaluation result | `EvaluationForm.jsx` | `/panel/evaluations/:reviewId` | `POST /api/evaluations/:id/submit` | `server/tests/api.test.js` |

---

## 5. Administrator Use Cases (`A1 - A8`)

| ID | Use Case | Frontend Component | Route | API Endpoint | Test File |
|---|---|---|---|---|---|
| **A1** | Manage users (create, edit, activate, approve) | `UserManagement.jsx` | `/admin/users` | `GET /api/users`<br>`POST /api/users`<br>`PATCH /api/users/:id` | `server/tests/api.test.js` |
| **A2** | Manage departments | `DepartmentManagement.jsx` | `/admin/departments` | `GET /api/departments`<br>`POST /api/departments`<br>`PATCH /api/departments/:id` | `server/tests/api.test.js` |
| **A3** | Manage roles and permissions | `UserManagement.jsx` | `/admin/users` | `PATCH /api/users/:id` | `server/tests/api.test.js` |
| **A4** | Manage project records | `ProjectRecords.jsx` | `/admin/projects` | `GET /api/projects`<br>`PATCH /api/projects/:id/status` | `server/tests/api.test.js` |
| **A5** | Manage review schedules | `ReviewSchedules.jsx` | `/admin/reviews` | `GET /api/reviews`<br>`PATCH /api/reviews/:id/cancel` | `server/tests/api.test.js` |
| **A6** | Manage notifications & announcements | `AdminAnnouncements.jsx` | `/admin/announcements` | `POST /api/notifications/announcements`<br>`GET /api/notifications/announcements` | `server/tests/api.test.js` |
| **A7** | Generate system reports | `SystemReports.jsx`, `AdminDashboard.jsx` | `/admin/reports`<br>`/admin/dashboard` | `GET /api/reports/:type`<br>`GET /api/dashboard` | `server/tests/api.test.js` |
| **A8** | Configure settings (deadlines, rubric, limits) | `AdminSettings.jsx` | `/admin/settings` | `GET /api/settings`<br>`PATCH /api/settings` | `server/tests/api.test.js` |

---

## 6. Project Workspace (`PM1 - PM10`)

| ID | Feature | Frontend Component | Route | API Endpoint | Test File |
|---|---|---|---|---|---|
| **PM1** | Project summary (counters, progress, deadlines) | `WorkspaceSummary.jsx` | `/projects/:id` (Summary) | `GET /api/projects/:id` | `server/tests/api.test.js` |
| **PM2** | Tasks: create, edit, assign, prioritise, comment | `TaskModal.jsx`, `TaskList.jsx` | `/projects/:id` (Tasks) | `POST /api/projects/:id/tasks`<br>`PATCH /api/projects/:id/tasks/:taskId` | `server/tests/api.test.js` |
| **PM3** | Milestones | `MilestonesWorkstreams.jsx` | `/projects/:id` (Milestones) | `POST /api/projects/:id/milestones`<br>`PATCH /api/projects/:id/milestones/:id` | `server/tests/api.test.js` |
| **PM4** | Workstreams | `MilestonesWorkstreams.jsx` | `/projects/:id` (Milestones) | `POST /api/projects/:id/workstreams`<br>`PATCH /api/projects/:id/workstreams/:id` | `server/tests/api.test.js` |
| **PM5** | Task list with filters + "Unscheduled" view | `TaskList.jsx` | `/projects/:id` (Tasks) | `GET /api/projects/:id/tasks` | `server/tests/api.test.js` |
| **PM6** | Kanban board (5 columns + drag/drop + keyboard) | `KanbanBoard.jsx` | `/projects/:id` (Board) | `PATCH /api/projects/:id/tasks/:taskId/status` | `server/tests/api.test.js` |
| **PM7** | Timeline (Gantt-style CSS grid) | `TimelineGantt.jsx` | `/projects/:id` (Timeline) | `GET /api/projects/:id/workspace` | `server/tests/api.test.js` |
| **PM8** | Team workload distribution | `TeamWorkload.jsx` | `/projects/:id` (Workload) | `GET /api/projects/:id` | `server/tests/api.test.js` |
| **PM9** | Recent activity (tamper-proof audit) | `ProjectActivity.jsx` | `/projects/:id` (Activity) | `GET /api/projects/:id/activity` | `server/tests/api.test.js` |
| **PM10**| Calendar (derived reviews/milestones/tasks) | `CalendarPage.jsx` | `/student/calendar`<br>`/guide/calendar`<br>`/panel/calendar` | `GET /api/calendar/events` | `server/tests/api.test.js` |
