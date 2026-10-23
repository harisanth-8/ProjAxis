# ProjAxis - UI/UX Architecture & Figma-to-Code Mapping

This document details the interface architecture of ProjAxis, mapping wireframe and screen concepts to production React components and detailing design token compliance and responsive adaptations.

---

## 1. Design Token Palette & Academic Aesthetics

ProjAxis is built with an official, desktop-first academic administration design aesthetic. It avoids playful or casual app paradigms (no emojis, no glassmorphism, no gradient backgrounds, no decorative animations).

| Token Name | Hex Code | Purpose in ProjAxis UI |
|---|---|---|
| `--color-navy` | `#17365D` | Primary brand headers, sidebar background, high-emphasis text, login card branding. |
| `--color-academic-blue` | `#2F65A7` | Interactive buttons, active tab indicators, links, primary progress bars. |
| `--color-light-blue` | `#EAF2FB` | Subtle hover backgrounds, info alerts, draft/submitted badge backgrounds. |
| `--color-page-bg` | `#F5F7FA` | Global background for body, dashboards, and auth containers. |
| `--color-surface` | `#FFFFFF` | Cards, modals, tables, form inputs, top navigation bar. |
| `--color-text` | `#243247` | High-contrast, WCAG AA compliant primary text typography. |
| `--color-muted-text` | `#64748B` | Secondary metadata, dates, subheaders, placeholder text. |
| `--color-border` | `#DCE3EC` | Clean 1px structural dividing lines on cards, tables, inputs, and modals. |
| `--color-success` | `#27856A` | Approved status, Done tasks, published marks, Present attendance. |
| `--color-warning` | `#C58B24` | Revision required, In Progress tasks, capacity cap warnings, Excused attendance. |
| `--color-error` | `#C94C4C` | Rejected status, overdue tasks, failed grades, Absent attendance. |

**Typography:** Single modern sans-serif font family: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.  
**Border Radius:** Strict 6px - 8px radius on cards, buttons, badges, and modals.

---

## 2. Figma Screens to Code Mapping

| Figma / Concept Screen | ProjAxis Route | React Component File | Key Elements & Information Hierarchy |
|---|---|---|---|
| **Auth: Sign In** | `/login` | `client/src/pages/auth/Login.jsx` | Centered official card, institutional wordmark, quick demo login buttons for all 5 roles. |
| **Auth: Student / Faculty Registration** | `/register` | `client/src/pages/auth/Register.jsx` | Two-tier registration: Students self-register; Guides/HODs enter Pending Approval state. |
| **Auth: Forgot / Reset Password** | `/forgot-password`, `/reset-password` | `ForgotPassword.jsx`, `ResetPassword.jsx` | Hashed single-use reset token flow with 30-minute expiry. |
| **Student Dashboard** | `/student/dashboard` | `client/src/pages/student/StudentDashboard.jsx` | Metric cards (Task Progress %, Reported Progress %), active project banner, open tasks, upcoming reviews, quick action buttons. |
| **Proposal Submission (Abstract)** | `/student/submit-proposal` | `client/src/pages/student/SubmitProposal.jsx` | Multi-step form: Title, Domain, Problem Statement, Objectives, Methodology, Outcome, Mentor Preferences. |
| **Mentor Selection** | `/student/add-mentor` | `client/src/pages/student/AddMentor.jsx` | Prioritized selection of up to 3 faculty guides with domain tags. |
| **Project Workspace (Summary)** | `/projects/:id` (Summary) | `client/src/components/projects/WorkspaceSummary.jsx` | 7-day metric counters, Recharts status donut, Recharts priority breakdown, deadlines, recent audit feed. |
| **Project Workspace (Tasks)** | `/projects/:id` (Tasks) | `client/src/components/tasks/TaskList.jsx` | Filter bar (status, assignee, priority, workstream), search, sort, and dedicated "Unscheduled" filter view. |
| **Project Workspace (Board)** | `/projects/:id` (Board) | `client/src/components/board/KanbanBoard.jsx` | 5-column Kanban with `@dnd-kit` drag-and-drop plus accessible dropdown "Move to" menu. |
| **Project Workspace (Timeline)** | `/projects/:id` (Timeline) | `client/src/components/timeline/TimelineGantt.jsx` | Custom CSS-grid Gantt chart with today indicator, milestone flags, and overdue/blocking task highlights. |
| **Project Workspace (Milestones)** | `/projects/:id` (Milestones) | `client/src/components/projects/MilestonesWorkstreams.jsx` | Workstream phase progress and milestone achievement checkboxes. |
| **Project Workspace (Workload)** | `/projects/:id` (Workload) | `client/src/components/projects/TeamWorkload.jsx` | Tabular team workload showing each member's share of assigned tasks next to raw counts. |
| **Project Workspace (Documents)** | `/projects/:id` (Documents) | `client/src/components/projects/ProjectDocuments.jsx` | Version-controlled document repository with magic-byte file signature validation and authorized streaming. |
| **Weekly Report Submission** | `/student/submit-weekly-report` | `client/src/pages/student/SubmitWeeklyReport.jsx` | One-per-week submission with Monday cutoff and automated late flag calculation. |
| **Final Project Submission** | `/student/final-submission` | `client/src/pages/student/FinalSubmission.jsx` | Tech stack, repository link, final abstract, and mandatory final report upload. |
| **Student Reviews & Attendance** | `/student/reviews` | `client/src/pages/student/StudentReviews.jsx` | Scheduled reviews, attendance history (Present/Absent/Excused), and published rubric marks. |
| **Guide Dashboard** | `/guide/dashboard` | `client/src/pages/guide/GuideDashboard.jsx` | Supervised team counts, pending proposals, reports needing feedback, tasks awaiting review. |
| **Guide Proposal Review** | `/guide/proposals` | `client/src/pages/guide/ReviewProposals.jsx` | Side-by-side proposal browser with version history and Approve / Reject / Request Revision actions. |
| **Guide Schedule Review** | `/guide/reviews` | `client/src/pages/guide/ScheduleReview.jsx` | Milestone scheduling with conflict detection, reschedule history, and attendance marking modal. |
| **HOD Dashboard** | `/hod/dashboard` | `client/src/pages/hod/HodDashboard.jsx` | Department stats, pending allocations, topic approvals, and guide workload capacity utilization bars. |
| **HOD Guide Allocation** | `/hod/allocations` | `client/src/pages/hod/GuideAllocation.jsx` | Guide allocation interface honoring student mentor preferences and enforcing the 8-project capacity cap. |
| **HOD Topic Sanction** | `/hod/topic-approvals` | `client/src/pages/hod/TopicApprovals.jsx` | Two-tier topic approval; atomically transitions proposal and instantiates active project workspace. |
| **HOD Review Oversight** | `/hod/reviews` | `client/src/pages/hod/ReviewManagement.jsx` | Panel member assignment to reviews and official evaluation result publishing. |
| **HOD & Admin Reports** | `/hod/reports`, `/admin/reports` | `DepartmentReports.jsx`, `SystemReports.jsx` | Live report tables, CSV download, and print-optimized PDF styling. |
| **Review Panel Evaluations** | `/panel/evaluations/:reviewId`| `client/src/pages/panel/EvaluationForm.jsx` | Rubric scoring per student (5 criteria x 10 marks), real-time subtotal calculation, defense remarks. |
| **Admin User & Role Control** | `/admin/users` | `client/src/pages/admin/UserManagement.jsx` | Account creation, password generation, activation/deactivation, and faculty registration approval. |
| **Admin System Settings** | `/admin/settings` | `client/src/pages/admin/AdminSettings.jsx` | Configuration of institution name, approval mode, deadlines, capacity cap, and file size limits. |
| **Institutional Timetable** | `/student/calendar`, `/guide/calendar`, etc. | `client/src/pages/shared/CalendarPage.jsx` | FullCalendar month/week/list views with derived deadlines and custom meeting scheduling. |

---

## 3. Deviations & Improvements over Figma Concept

1. **Information Density & Contrast:** Figma mockups often feature low-contrast gray text and excessive whitespace. ProjAxis enforces strict WCAG AA contrast (`#243247` on `#FFFFFF` and `#F5F7FA`) and compact administrative table layouts.
2. **Keyboard Accessibility on Kanban Board:** Drag-and-drop can exclude keyboard-only and screen reader users. ProjAxis integrates an accessible dropdown menu on every task card allowing direct movement between permitted columns without a mouse.
3. **Responsive Degradation:** On mobile and tablet breakpoints (360px - 768px), dense tables degrade cleanly into scrollable card containers or horizontally pannable views, and the fixed desktop sidebar collapses into an accessible off-canvas drawer.
