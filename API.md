# ProjAxis - API Reference Specification

All API endpoints are prefixed with `/api`.  
Success responses follow the standard format: `{ data, meta? }`.  
Error responses follow: `{ error: { code, message, details? } }`.  
Authentication is verified via the httpOnly `token` cookie or Bearer header.

---

## 1. Authentication & User Profile

### `POST /api/auth/register`
- **Allowed Roles:** Public (Student self-register; Guide/HOD pending approval)
- **Request Body:**
  ```json
  {
    "name": "Jane Student",
    "email": "jane@projaxis.edu",
    "password": "Password@123",
    "phone": "+919876543210",
    "role": "student",
    "departmentId": "650000000000000000000001",
    "regNo": "RA2111003010099",
    "semester": 8
  }
  ```
- **Response (201):**
  ```json
  {
    "data": {
      "user": {
        "userId": "USR-2026-0001",
        "name": "Jane Student",
        "email": "jane@projaxis.edu",
        "roles": ["student"],
        "accountStatus": "Active"
      },
      "token": "eyJhbGciOi..."
    }
  }
  ```

### `POST /api/auth/login`
- **Allowed Roles:** Public
- **Request Body:**
  ```json
  {
    "email": "admin@projaxis.edu",
    "password": "Password@123"
  }
  ```
- **Response (200):** Sets httpOnly cookie and returns:
  ```json
  {
    "data": {
      "user": {
        "userId": "USR-2026-0001",
        "name": "Platform Administrator",
        "email": "admin@projaxis.edu",
        "roles": ["admin"]
      },
      "token": "eyJhbGciOi..."
    }
  }
  ```

### `GET /api/auth/me`
- **Allowed Roles:** Any Authenticated User
- **Response (200):**
  ```json
  {
    "data": {
      "user": {
        "userId": "USR-2026-0001",
        "name": "Jane Student",
        "email": "jane@projaxis.edu",
        "roles": ["student"]
      }
    }
  }
  ```

### `POST /api/auth/change-password`
- **Allowed Roles:** Any Authenticated User
- **Request Body:**
  ```json
  {
    "currentPassword": "Password@123",
    "newPassword": "NewSecurePassword@123"
  }
  ```
- **Response (200):**
  ```json
  {
    "data": { "message": "Password successfully updated." }
  }
  ```

---

## 2. Project Proposals

### `POST /api/proposals`
- **Allowed Roles:** `student` (Own team)
- **Request Body:**
  ```json
  {
    "title": "Autonomous Drone Fleet Coordination",
    "domain": "Artificial Intelligence & Robotics",
    "problemStatement": "Urban emergency logistics require coordinated decentralized drone routing.",
    "objectives": "Develop decentralized consensus routing algorithm.",
    "methodology": "Graph neural networks combined with dynamic obstacle avoidance.",
    "expectedOutcome": "Fully functioning simulation and testbed with <50ms latency.",
    "mentorChoices": [
      { "guideId": "USR-2026-0010", "preferenceOrder": 1 }
    ]
  }
  ```
- **Response (201):**
  ```json
  {
    "data": {
      "proposalId": "PRP-2026-0001",
      "approvalStatus": "Draft",
      "title": "Autonomous Drone Fleet Coordination"
    }
  }
  ```

### `PATCH /api/proposals/:id/submit`
- **Allowed Roles:** `student` (Own team)
- **Response (200):** Transitions status from `Draft` to `Submitted`.

### `POST /api/proposals/:id/assign-guide`
- **Allowed Roles:** `hod`, `admin`
- **Request Body:**
  ```json
  {
    "guideId": "USR-2026-0010",
    "overrideReason": "Specialized domain expert"
  }
  ```
- **Response (200):** Assigns guide and transitions status to `With Guide`.

### `POST /api/proposals/:id/guide-decision`
- **Allowed Roles:** `guide` (Assigned guide)
- **Request Body:**
  ```json
  {
    "decision": "Approve",
    "comments": "Strong technical rigor and feasible timeline."
  }
  ```
- **Response (200):** Transitions to `Guide Approved` (or `Approved` if single-tier).

### `POST /api/proposals/:id/hod-decision`
- **Allowed Roles:** `hod`, `admin`
- **Request Body:**
  ```json
  {
    "decision": "Approve",
    "comments": "Department topic sanctioned."
  }
  ```
- **Response (200):** Transitions to `Approved` and transactionally instantiates the `Project` record.

---

## 3. Project Workspace & Tasks

### `GET /api/projects/:id`
- **Allowed Roles:** `student` (own team), `guide` (supervised), `hod` (own department), `panel` (assigned review), `admin`.
- **Response (200):** Returns full project object including tasks, milestones, workstreams, documents, and progress counters.

### `POST /api/projects/:id/tasks`
- **Allowed Roles:** `student` (own project), `guide` (supervised), `admin`.
- **Request Body:**
  ```json
  {
    "title": "Implement Pathfinding A* Algorithm",
    "description": "Benchmark baseline heuristics on 3D grid.",
    "priority": "High",
    "assigneeId": "USR-2026-0001",
    "startDate": "2026-11-01",
    "dueDate": "2026-11-15"
  }
  ```
- **Response (201):** Returns created task with ID `TSK-0001`.

### `PATCH /api/projects/:id/tasks/:taskId/status`
- **Allowed Roles:**
  - `student` (assigned to task): `To Do`, `In Progress`, `Under Review`, `Blocked`.
  - `guide`, `admin`: any status including `Done`.
- **Request Body:**
  ```json
  {
    "status": "In Progress"
  }
  ```
- **Response (200):** Returns updated task.

---

## 4. Documents & Artifacts

### `POST /api/projects/:id/documents`
- **Allowed Roles:** `student` (own team), `guide` (supervised), `admin`.
- **Form Data:**
  - `file`: binary file (max 10MB)
  - `category`: `Report` | `Proposal` | `Presentation` | `Source Code` | `Other`
- **Response (201):** Returns created document metadata with `versionNumber`.

### `GET /api/documents/:id/download`
- **Allowed Roles:** Authorized project viewers.
- **Response (200):** Binary stream with `Content-Disposition: attachment; filename="..."`.

---

## 5. Weekly Reports & Reviews

### `POST /api/progress/:projectId/reports`
- **Allowed Roles:** `student` (own team)
- **Request Body:**
  ```json
  {
    "weekNo": 4,
    "workDone": "Implemented baseline simulation model in PyTorch.",
    "plannedNext": "Add obstacle avoidance module.",
    "blockers": "None",
    "progress": 35
  }
  ```
- **Response (201):** Returns created report with `isLate` flag calculated automatically.

### `POST /api/reviews`
- **Allowed Roles:** `guide` (supervised), `hod`, `admin`.
- **Request Body:**
  ```json
  {
    "projectId": "PRJ-2026-0001",
    "reviewType": "Review 1",
    "reviewDate": "2026-11-10T10:00:00.000Z",
    "venue": "Lab 304",
    "instructions": "Bring draft report and presentation slides."
  }
  ```
- **Response (201):** Returns scheduled review.

### `POST /api/evaluations/:reviewId/submit`
- **Allowed Roles:** `panel` (Assigned panel member)
- **Request Body:**
  ```json
  {
    "rubric": [
      { "criterion": "Problem Definition", "maxMarks": 10 },
      { "criterion": "Methodology", "maxMarks": 10 },
      { "criterion": "Implementation", "maxMarks": 10 },
      { "criterion": "Presentation", "maxMarks": 10 },
      { "criterion": "Viva Defense", "maxMarks": 10 }
    ],
    "entries": [
      {
        "studentId": "USR-2026-0001",
        "scores": [9, 8, 9, 8, 9],
        "total": 43,
        "comments": "Excellent grasp of algorithmic fundamentals."
      }
    ]
  }
  ```
- **Response (200):** Records panel score. When all assigned members submit, transitions evaluation to `Submitted`.

### `POST /api/evaluations/:evaluationId/publish`
- **Allowed Roles:** `hod`, `admin`.
- **Response (200):** Publishes marks and makes results accessible to students.

---

## 6. Postman Collection Export

A complete, importable Postman Collection is provided in the repository at `docs/postman_collection.json`. To import:
1. Open Postman.
2. Click **Import**.
3. Select `docs/postman_collection.json`.
4. Set the `baseUrl` variable to `http://localhost:5000/api`.
