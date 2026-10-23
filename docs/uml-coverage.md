# ProjAxis - Domain & UML Class Diagram Coverage

This document maps all domain classes, relationships, and methods from the ProjAxis specification to their respective Mongoose models, service functions, and API routes.

---

## 1. Domain Models & Architecture

### User Hierarchy (Base Class + Embedded Role Profiles)
- **Model File:** `server/models/User.js`
- **Fields:** `userId`, `name`, `email` (unique), `passwordHash`, `phone`, `roles[]` (`student`, `guide`, `hod`, `panel`, `admin`), `departmentId`, `accountStatus` (`Active`, `Pending Approval`, `Inactive`), `mustChangePassword`, `profileImage`, `createdAt`, `updatedAt`.
- **Subclass Profiles:**
  - `StudentProfile`: `regNo` (unique), `semester`, `department`.
  - `GuideProfile`: `facultyId` (unique), `department`, `capacityLimit`.
  - `HodProfile`: `hodId` (unique), `department`.
  - `PanelProfile`: `panelId` (unique), `designation`.

### Department
- **Model File:** `server/models/Department.js`
- **Fields:** `name`, `code` (unique, e.g. CSE, ECE), `description`.

### ProjectProposal (The Abstract)
- **Model File:** `server/models/ProjectProposal.js`
- **Fields:** `proposalId` (`PRP-YYYY-nnnn`), `studentIds[]`, `title`, `domain`, `description`, `problemStatement`, `objectives`, `methodology`, `expectedOutcome`, `mentorChoices[]` (up to 3 in priority order), `assignedGuideId`, `submissionDate`, `approvalStatus` (`Draft`, `Submitted`, `With Guide`, `Guide Approved`, `Revision Required`, `Approved`, `Rejected`), `decisionHistory[]`, `versions[]` (immutable snapshots).

### Project
- **Model File:** `server/models/Project.js`
- **Fields:** `projectId` (`PRJ-YYYY-nnnn`), `proposalId`, `studentIds[]` (1 to 4 members), `guideId`, `title`, `domain`, `description`, `status` (`Active`, `On Hold`, `Final Submitted`, `Under Evaluation`, `Completed`, `Cancelled`), `startDate`, `endDate`, `academicYear`, `finalSubmissionDetails` (techUsed, repoLink, abstract, reportDocumentId), `completedAt`.
- **Calculated Measures:** Progress is never stored; computed on-the-fly:
  - *Task Progress* = Done tasks / total tasks.
  - *Reported Progress* = latest weekly progress report percentage.

### Document
- **Model File:** `server/models/Document.js`
- **Fields:** `documentId`, `projectId`, `proposalId`, `progressReportId`, `reviewId`, `category` (`Proposal`, `Report`, `Presentation`, `Source Code`, `Other`), `fileName`, `storedFilename`, `fileType`, `size`, `uploadDate`, `uploadedBy`, `versionNumber`, `versionGroupId`, `isDeleted`.

### ProgressReport (Weekly)
- **Model File:** `server/models/ProgressReport.js`
- **Fields:** `reportId`, `projectId`, `weekNo`, `weekStartDate`, `workDone`, `plannedNext`, `blockers`, `progress` (0-100), `remarks`, `attachments[]`, `status` (`Submitted`, `Reviewed`, `Needs Attention`), `isLate`.

### Feedback
- **Model File:** `server/models/Feedback.js`
- **Fields:** `feedbackId`, `projectId`, `targetType` (`Proposal`, `ProgressReport`, `Review`, `Document`), `targetId`, `authorId`, `recipientIds[]`, `comments`, `date`, `editHistory[]`.

### Review
- **Model File:** `server/models/Review.js`
- **Fields:** `reviewId`, `projectId`, `reviewType` (`Review 1`, `Review 2`, `Review 3`, `Final Viva`, `Guide Meeting`), `reviewDate`, `venue`, `instructions`, `guideId`, `panelMemberIds[]`, `status` (`Scheduled`, `Completed`, `Rescheduled`, `Cancelled`), `rescheduleHistory[]`.

### Attendance
- **Model File:** `server/models/Attendance.js`
- **Fields:** `reviewId`, `records[{ studentId, status ('Present', 'Absent', 'Excused'), note }]`, `recordedBy`, `recordedAt`, `editHistory[]`.

### Evaluation
- **Model File:** `server/models/Evaluation.js`
- **Fields:** `evaluationId`, `reviewId`, `rubric[{ criterion, maxMarks }]`, `entries[{ studentId, panelScores[{ panelMemberId, scores[], total, comments, submittedAt }], marks (average total), remarks, grade }]`, `status` (`Draft`, `Submitted`, `Published`), `publishedBy`, `publishedAt`.

### Project Workspace Entities: Workstream, Milestone, Task
- **Workstream (`Workstream.js`):** `workstreamId`, `projectId`, `title`, `description`, `order`, `status` (`Open`, `Completed`).
- **Milestone (`Milestone.js`):** `milestoneId`, `projectId`, `title`, `description`, `dueDate`, `status` (`Pending`, `Achieved`, `Missed`), `achievedAt`.
- **Task (`Task.js`):** `taskId` (`TSK-nnnn`), `projectId`, `title`, `description`, `assigneeId`, `createdBy`, `priority` (`Highest` to `Lowest`), `status` (`To Do`, `In Progress`, `Under Review`, `Blocked`, `Done`), `startDate`, `dueDate`, `completedAt`, `workstreamId`, `milestoneId`, `dependsOn[]`, `comments[]`, `attachmentDocumentIds[]`.

### CalendarEvent, Notification, ActivityLog, Settings, Counter
- **CalendarEvent (`CalendarEvent.js`):** `eventId`, `projectId`, `title`, `description`, `eventType`, `startAt`, `endAt`, `organizerId`, `participantIds[]`, `status`.
- **Notification (`Notification.js`):** `notificationId`, `recipientId`, `category`, `message`, `date`, `status` (`Unread`, `Read`), `relatedEntityType`, `relatedEntityId`.
- **ActivityLog (`ActivityLog.js`):** `logId`, `projectId`, `actor`, `action`, `entity`, `description`, `timestamp`.
- **Settings (`Settings.js`):** `collegeName`, `approvalMode`, `proposalDeadline`, `weeklyReportDeadlineDay`, `rubric`, `gradeScale`, `guideCapacityCap`, `fileLimitMB`, `allowedFileTypes`.
- **Counter (`Counter.js`):** Atomic auto-increment sequences (`userId`, `PRP`, `PRJ`, `TSK`, etc.).

---

## 2. UML Method to API & Service Mapping

| UML Class & Method | Model / Service Implementation | Controller / Route | Endpoint |
|---|---|---|---|
| `User.register()` | `server/models/User.js` | `server/controllers/authController.js` | `POST /api/auth/register` |
| `User.login()` | `server/models/User.js` | `server/controllers/authController.js` | `POST /api/auth/login` |
| `User.updateProfile()` | `server/models/User.js` | `server/controllers/authController.js` | `PATCH /api/auth/profile` |
| `User.changePassword()` | `bcrypt.hash()` | `server/controllers/authController.js` | `POST /api/auth/change-password` |
| `Student.submitProposal()` | `ProjectProposal.js` | `server/controllers/proposalController.js` | `POST /api/proposals` |
| `Student.addMentor()` | `mentorChoices[]` | `server/controllers/proposalController.js` | `POST /api/proposals` |
| `Student.submitWeeklyReport()` | `ProgressReport.js` | `server/controllers/progressController.js` | `POST /api/progress/:id/reports` |
| `Student.submitFinalProject()` | `Project.js` (Final Submitted) | `server/controllers/workspaceController.js` | `POST /api/projects/:id/final-submission` |
| `Guide.reviewProposal()` | `decisionHistory[]` | `server/controllers/proposalController.js` | `POST /api/proposals/:id/guide-decision` |
| `Guide.scheduleRev()` | `Review.js` | `server/controllers/reviewController.js` | `POST /api/reviews` |
| `Guide.rescheduleRev()` | `rescheduleHistory[]` | `server/controllers/reviewController.js` | `PATCH /api/reviews/:id/reschedule` |
| `Guide.markAttendance()` | `Attendance.js` | `server/controllers/reviewController.js` | `POST /api/reviews/:id/attendance` |
| `Guide.giveFeedback()` | `Feedback.js` | `server/controllers/progressController.js` | `POST /api/projects/:id/feedback` |
| `HOD.assignGuide()` | `assignedGuideId` | `server/controllers/proposalController.js` | `POST /api/proposals/:id/assign-guide` |
| `HOD.approveTopic()` | `withTransaction` -> `Project.create()` | `server/controllers/proposalController.js` | `POST /api/proposals/:id/hod-decision` |
| `HOD.assignPanel()` | `Review.panelMemberIds[]` | `server/controllers/reviewController.js` | `PATCH /api/reviews/:id/assign-panel` |
| `HOD.publishResults()` | `Evaluation.status = 'Published'` | `server/controllers/reviewController.js` | `POST /api/evaluations/:id/publish` |
| `ReviewPanel.submitMarks()`| `Evaluation.entries[]` | `server/controllers/reviewController.js` | `POST /api/evaluations/:id/submit` |
| `Evaluation.generateResult()`| Grade Scale Matrix calculation | `server/controllers/reviewController.js` | Automated in `submitEvaluation` |
| `Document.upload()` | Multer + Magic Byte Check | `server/controllers/documentController.js` | `POST /api/projects/:id/documents` |
| `Document.download()` | Authorized Stream | `server/controllers/documentController.js` | `GET /api/documents/:id/download` |
| `Document.delete()` | Soft-delete (`isDeleted: true`) | `server/controllers/documentController.js` | `DELETE /api/documents/:id` |
| `Notification.send()` | `notificationService.js` | `server/services/notificationService.js` | Event-driven trigger |
| `Notification.markAsRead()`| `Notification.status = 'Read'` | `server/controllers/notificationController.js` | `PATCH /api/notifications/:id/read` |
| `ActivityLog.record()` | Append-only Audit Trail | `server/utils/logger.js` | Embedded on real events |
