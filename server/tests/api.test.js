import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import ProjectProposal from '../models/ProjectProposal.js';
import Project from '../models/Project.js';
import Review from '../models/Review.js';
import Evaluation from '../models/Evaluation.js';
import Task from '../models/Task.js';

let studentToken;
let studentUser;
let guideToken;
let guideUser;
let hodToken;
let hodUser;
let adminToken;
let adminUser;
let otherDeptHodToken;
let cseDept;
let eceDept;

beforeAll(async () => {
  await connectDB();
  await User.deleteOne({ email: 'test.temp.student@projaxis.edu' });
  await ProjectProposal.deleteMany({ title: 'Real-Time Edge Audio Denoising using MobileNet' });

  // Get demo users from seed
  adminUser = await User.findOne({ email: 'admin@projaxis.edu' });
  hodUser = await User.findOne({ email: 'hod.cse@projaxis.edu' });
  const otherHod = await User.findOne({ email: 'hod.ece@projaxis.edu' });
  guideUser = await User.findOne({ email: 'guide.subramanian@projaxis.edu' }) || await User.findOne({ email: 'guide.knuth@projaxis.edu' });
  studentUser = await User.findOne({ email: 'student1@projaxis.edu' });

  cseDept = await Department.findOne({ code: 'CSE' });
  eceDept = await Department.findOne({ code: 'ECE' });

  // Login as admin
  const resAdmin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@projaxis.edu', password: 'Password@123' });
  adminToken = resAdmin.body.data.token;

  // Login as HOD
  const resHod = await request(app)
    .post('/api/auth/login')
    .send({ email: 'hod.cse@projaxis.edu', password: 'Password@123' });
  hodToken = resHod.body.data.token;

  // Login as other HOD (ECE)
  const resOtherHod = await request(app)
    .post('/api/auth/login')
    .send({ email: 'hod.ece@projaxis.edu', password: 'Password@123' });
  otherDeptHodToken = resOtherHod.body.data.token;

  // Login as Guide
  const resGuide = await request(app)
    .post('/api/auth/login')
    .send({ email: 'guide.subramanian@projaxis.edu', password: 'Password@123' });
  guideToken = resGuide.body.data.token;

  // Login as Student
  const resStudent = await request(app)
    .post('/api/auth/login')
    .send({ email: 'student1@projaxis.edu', password: 'Password@123' });
  studentToken = resStudent.body.data.token;
});

afterAll(async () => {
  await disconnectDB();
});

describe('1. Authentication & Security Tests', () => {
  it('rejects invalid password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@projaxis.edu', password: 'WrongPassword' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects deactivated/pending user login with 403', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'guide.pending@projaxis.edu', password: 'Password@123' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('PENDING_APPROVAL');
  });

  it('fetches current user details via /api/auth/me', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('student1@projaxis.edu');
    expect(res.body.data.user.roles).toContain('student');
  });

  it('prevents student from accessing admin-only user list (403)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 400 for malformed/invalid ObjectId', async () => {
    const res = await request(app)
      .get('/api/proposals/invalid-id-format')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });
});

describe('2. Proposal & Approval Workflow Tests', () => {
  it('allows student to draft a new proposal', async () => {
    // Register temporary new student to avoid conflict
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Student',
        email: 'test.temp.student@projaxis.edu',
        password: 'Password@123',
        role: 'student',
        departmentId: cseDept._id.toString(),
        regNo: '2023CSE999',
        semester: 8
      });

    let tempToken = regRes.body?.data?.token;
    if (!tempToken) {
      const loginRes = await request(app).post('/api/auth/login').send({ email: 'test.temp.student@projaxis.edu', password: 'Password@123' });
      tempToken = loginRes.body?.data?.token;
    }

    const propRes = await request(app)
      .post('/api/proposals')
      .set('Authorization', `Bearer ${tempToken}`)
      .send({
        title: 'Real-Time Edge Audio Denoising using MobileNet',
        domain: 'Audio & DSP',
        problemStatement: 'Background speech interferes with critical emergency calls.',
        objectives: 'Design lightweight recurrent neural network under 2MB.',
        methodology: 'Spectrogram masking trained on DNS Challenge dataset.',
        expectedOutcome: 'Low-latency C++ inference library.',
        mentorChoices: [guideUser._id.toString()]
      });

    expect(propRes.status).toBe(201);
    expect(propRes.body.data.approvalStatus).toBe('Draft');

    // Submit proposal
    const submitRes = await request(app)
      .post(`/api/proposals/${propRes.body.data._id}/submit`)
      .set('Authorization', `Bearer ${tempToken}`);

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.data.approvalStatus).toBe('Submitted');
    expect(submitRes.body.data.versions.length).toBe(1);

    // HOD ECE attempting to allocate guide to CSE proposal should be rejected (403 department scoping)
    const crossDeptRes = await request(app)
      .post(`/api/proposals/${propRes.body.data._id}/assign-guide`)
      .set('Authorization', `Bearer ${otherDeptHodToken}`)
      .send({ guideId: guideUser._id.toString() });

    expect(crossDeptRes.status).toBe(403);

    // HOD CSE allocates guide
    const assignRes = await request(app)
      .post(`/api/proposals/${propRes.body.data._id}/assign-guide`)
      .set('Authorization', `Bearer ${hodToken}`)
      .send({ guideId: guideUser._id.toString() });

    expect(assignRes.status).toBe(200);
    expect(assignRes.body.data.approvalStatus).toBe('With Guide');

    // Invalid transition: Attempting HOD topic approval before guide review should return 409
    const invalidHopRes = await request(app)
      .post(`/api/proposals/${propRes.body.data._id}/topic-approval`)
      .set('Authorization', `Bearer ${hodToken}`)
      .send({ decision: 'Approved' });

    expect(invalidHopRes.status).toBe(409);

    // Guide Approves
    const guideDecisionRes = await request(app)
      .post(`/api/proposals/${propRes.body.data._id}/guide-decision`)
      .set('Authorization', `Bearer ${guideToken}`)
      .send({ decision: 'Approve', comments: 'Excellent DSP scope' });

    expect(guideDecisionRes.status).toBe(200);
    expect(guideDecisionRes.body.data.approvalStatus).toBe('Guide Approved');

    // HOD gives Topic Approval -> Transactionally creates Active Project!
    const topicRes = await request(app)
      .post(`/api/proposals/${propRes.body.data._id}/topic-approval`)
      .set('Authorization', `Bearer ${hodToken}`)
      .send({ decision: 'Approved', comments: 'Approved by Department Head' });

    expect(topicRes.status).toBe(200);
    expect(topicRes.body.data.proposal.approvalStatus).toBe('Approved');
    expect(topicRes.body.data.project.status).toBe('Active');
    expect(topicRes.body.data.project.projectId).toMatch(/^PRJ-\d{4}-\d{4}$/);
  });
});

describe('3. Project Workspace & Task Rules', () => {
  it('enforces task status transitions and permissions (409 for invalid)', async () => {
    const project = await Project.findOne({ projectId: 'PRJ-2026-CSE-001' }) || await Project.findOne();

    // Student creates a task on their project
    const taskRes = await request(app)
      .post(`/api/projects/${project._id}/tasks`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Run GStreamer Latency Benchmarks',
        priority: 'High',
        status: 'To Do',
        assigneeId: studentUser._id.toString()
      });

    expect(taskRes.status).toBe(201);
    const taskId = taskRes.body.data._id;

    // Student moves task to In Progress (Valid)
    const inProgRes = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ status: 'In Progress' });

    expect(inProgRes.status).toBe(200);

    // Student attempts to mark task as Done directly (Forbidden: Only guide or admin can mark Done -> 409)
    const forbiddenDoneRes = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ status: 'Done' });

    expect(forbiddenDoneRes.status).toBe(409);
    expect(forbiddenDoneRes.body.error.code).toBe('INVALID_TRANSITION');

    // Student submits task for review
    const underReviewRes = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ status: 'Under Review' });

    expect(underReviewRes.status).toBe(200);

    // Guide marks task as Done
    const guideDoneRes = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${guideToken}`)
      .send({ status: 'Done' });

    expect(guideDoneRes.status).toBe(200);
    expect(guideDoneRes.body.data.status).toBe('Done');
    expect(guideDoneRes.body.data.completedAt).not.toBeNull();
  });

  it('computes project workspace summary and team workload metrics', async () => {
    const project = await Project.findOne({ projectId: 'PRJ-2026-CSE-001' }) || await Project.findOne();

    const summaryRes = await request(app)
      .get(`/api/projects/${project._id}/summary`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.data.counters).toBeDefined();
    expect(summaryRes.body.data.taskProgress).toBeDefined();
    expect(summaryRes.body.data.statusDistribution).toBeDefined();

    const workloadRes = await request(app)
      .get(`/api/projects/${project._id}/workload`)
      .set('Authorization', `Bearer ${guideToken}`);

    expect(workloadRes.status).toBe(200);
    expect(workloadRes.body.data.workload.length).toBeGreaterThan(0);
  });
});

describe('4. Review, Attendance & Evaluation Publishing', () => {
  it('hides unpublished evaluations from students (Draft vs Published)', async () => {
    const review = await Review.findOne({ reviewType: 'Review 2' });

    // Student views Review 2 details (Evaluation is in Draft)
    const studentRes = await request(app)
      .get(`/api/reviews/${review._id}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(studentRes.status).toBe(200);
    expect(studentRes.body.data.evaluation).toBeNull(); // Hidden until published

    // Guide views Review 2 details (Draft evaluation is visible)
    const guideRes = await request(app)
      .get(`/api/reviews/${review._id}`)
      .set('Authorization', `Bearer ${guideToken}`);

    expect(guideRes.status).toBe(200);
    expect(guideRes.body.data.evaluation).not.toBeNull();
  });

  it('prevents scheduling reviews with conflicting guide time slots', async () => {
    const project = await Project.findOne({ projectId: 'PRJ-2026-CSE-001' }) || await Project.findOne();
    const existingReview = await Review.findOne({ status: 'Scheduled' });

    // Attempting to schedule another review for same guide at the exact same time
    const conflictRes = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${guideToken}`)
      .send({
        projectId: project._id.toString(),
        reviewType: 'Review 3',
        reviewDate: existingReview.reviewDate.toISOString(),
        venue: 'Room 101'
      });

    expect(conflictRes.status).toBe(409);
    expect(conflictRes.body.error.code).toBe('SCHEDULING_CONFLICT');
  });

  it('publishes evaluation marks and enforces unlock reason auditing', async () => {
    const cseProjectIds = await Project.find({ departmentId: cseDept._id }).distinct('_id');
    const evalDraft = await Evaluation.findOne({ status: 'Draft', projectId: { $in: cseProjectIds } }) || await Evaluation.findOne({ projectId: { $in: cseProjectIds } });

    // HOD publishes evaluation
    const pubRes = await request(app)
      .post(`/api/evaluations/${evalDraft._id}/publish`)
      .set('Authorization', `Bearer ${hodToken}`);

    expect(pubRes.status).toBe(200);
    expect(pubRes.body.data.status).toBe('Published');

    // Student attempts to unlock (Forbidden 403)
    const studentUnlock = await request(app)
      .post(`/api/evaluations/${evalDraft._id}/unlock`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ reason: 'Student unlock attempt' });

    expect(studentUnlock.status).toBe(403);

    // Admin unlocks with logged reason
    const adminUnlock = await request(app)
      .post(`/api/evaluations/${evalDraft._id}/unlock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Panel member score entry correction approved by Dean' });

    expect(adminUnlock.status).toBe(200);
    expect(adminUnlock.body.data.status).toBe('Submitted');
    expect(adminUnlock.body.data.unlockHistory.length).toBeGreaterThan(0);
  });
});
