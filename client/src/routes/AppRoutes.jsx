import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import AppLayout from '../layouts/AppLayout';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import ChangePassword from '../pages/auth/ChangePassword';
import AccessDenied from '../pages/auth/AccessDenied';

// Shared Pages
import Profile from '../pages/shared/Profile';
import ProjectDetail from '../pages/shared/ProjectDetail';
import NotificationsPage from '../pages/shared/NotificationsPage';
import CalendarPage from '../pages/shared/CalendarPage';

// Student Pages
import StudentDashboard from '../pages/student/StudentDashboard';
import SubmitProposal from '../pages/student/SubmitProposal';
import AddMentor from '../pages/student/AddMentor';
import MyProjects from '../pages/student/MyProjects';
import StudentReviews from '../pages/student/StudentReviews';
import SubmitWeeklyReport from '../pages/student/SubmitWeeklyReport';
import FinalSubmission from '../pages/student/FinalSubmission';

// Guide Pages
import GuideDashboard from '../pages/guide/GuideDashboard';
import ReviewProposals from '../pages/guide/ReviewProposals';
import MyTeams from '../pages/guide/MyTeams';
import ScheduleReview from '../pages/guide/ScheduleReview';

// HOD Pages
import HodDashboard from '../pages/hod/HodDashboard';
import AllProjects from '../pages/hod/AllProjects';
import GuideAllocation from '../pages/hod/GuideAllocation';
import TopicApprovals from '../pages/hod/TopicApprovals';
import ReviewManagement from '../pages/hod/ReviewManagement';
import DepartmentReports from '../pages/hod/DepartmentReports';

// Panel Pages
import PanelDashboard from '../pages/panel/PanelDashboard';
import AssignedReviews from '../pages/panel/AssignedReviews';
import EvaluationForm from '../pages/panel/EvaluationForm';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import UserManagement from '../pages/admin/UserManagement';
import DepartmentManagement from '../pages/admin/DepartmentManagement';
import ProjectRecords from '../pages/admin/ProjectRecords';
import ReviewSchedules from '../pages/admin/ReviewSchedules';
import AdminAnnouncements from '../pages/admin/AdminAnnouncements';
import AdminSettings from '../pages/admin/AdminSettings';
import SystemReports from '../pages/admin/SystemReports';

// Role-based Root Redirect
const RoleRedirect = () => {
  const { user, activeRole, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  switch (activeRole) {
    case 'student':
      return <Navigate to="/student/dashboard" replace />;
    case 'guide':
      return <Navigate to="/guide/dashboard" replace />;
    case 'hod':
      return <Navigate to="/hod/dashboard" replace />;
    case 'panel':
      return <Navigate to="/panel/dashboard" replace />;
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/access-denied" element={<AccessDenied />} />

      {/* Mandatory Password Change */}
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePassword />
          </ProtectedRoute>
        }
      />

      {/* Protected App Layout Wrapper */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Root Redirect */}
        <Route path="/" element={<RoleRedirect />} />

        {/* Shared Profile, Calendar, Notifications, Project Workspace */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />

        {/* Student Routes */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/submit-proposal"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <SubmitProposal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/add-mentor"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <AddMentor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/projects"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <MyProjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/projects/:id"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <ProjectDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/reviews"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentReviews />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/submit-weekly-report"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <SubmitWeeklyReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/projects/:projectId/report"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <SubmitWeeklyReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/final-submission"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <FinalSubmission />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/calendar"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <CalendarPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/notifications"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        {/* Guide Routes */}
        <Route
          path="/guide/dashboard"
          element={
            <ProtectedRoute allowedRoles={['guide']}>
              <GuideDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/guide/proposals"
          element={
            <ProtectedRoute allowedRoles={['guide']}>
              <ReviewProposals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/guide/teams"
          element={
            <ProtectedRoute allowedRoles={['guide']}>
              <MyTeams />
            </ProtectedRoute>
          }
        />
        <Route
          path="/guide/reviews"
          element={
            <ProtectedRoute allowedRoles={['guide']}>
              <ScheduleReview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/guide/calendar"
          element={
            <ProtectedRoute allowedRoles={['guide']}>
              <CalendarPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/guide/notifications"
          element={
            <ProtectedRoute allowedRoles={['guide']}>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        {/* HOD Routes */}
        <Route
          path="/hod/dashboard"
          element={
            <ProtectedRoute allowedRoles={['hod']}>
              <HodDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/projects"
          element={
            <ProtectedRoute allowedRoles={['hod']}>
              <AllProjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/allocations"
          element={
            <ProtectedRoute allowedRoles={['hod']}>
              <GuideAllocation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/topic-approvals"
          element={
            <ProtectedRoute allowedRoles={['hod']}>
              <TopicApprovals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/reviews"
          element={
            <ProtectedRoute allowedRoles={['hod']}>
              <ReviewManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/reports"
          element={
            <ProtectedRoute allowedRoles={['hod']}>
              <DepartmentReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/notifications"
          element={
            <ProtectedRoute allowedRoles={['hod']}>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        {/* Review Panel Routes */}
        <Route
          path="/panel/dashboard"
          element={
            <ProtectedRoute allowedRoles={['panel']}>
              <PanelDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/panel/assigned-projects"
          element={
            <ProtectedRoute allowedRoles={['panel']}>
              <AssignedReviews />
            </ProtectedRoute>
          }
        />
        <Route
          path="/panel/evaluations/:reviewId"
          element={
            <ProtectedRoute allowedRoles={['panel']}>
              <EvaluationForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/panel/calendar"
          element={
            <ProtectedRoute allowedRoles={['panel']}>
              <CalendarPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/panel/notifications"
          element={
            <ProtectedRoute allowedRoles={['panel']}>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/departments"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DepartmentManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/projects"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ProjectRecords />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reviews"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ReviewSchedules />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/announcements"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminAnnouncements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SystemReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminSettings />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
