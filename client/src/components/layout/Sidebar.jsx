import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  LayoutDashboard,
  FolderGit2,
  FileText,
  UserPlus,
  Calendar,
  Award,
  Bell,
  Users,
  Building,
  Settings as SettingsIcon,
  BarChart3,
  User,
  Layers,
  GraduationCap
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, activeRole, switchRole } = useAuth();
  const [collegeName, setCollegeName] = useState('ProjAxis Academic Institute');

  useEffect(() => {
    api.get('/settings').then((res) => {
      if (res.data?.collegeName) setCollegeName(res.data.collegeName);
    }).catch(() => {});
  }, []);

  const getNavLinks = () => {
    switch (activeRole) {
      case 'student':
        return [
          { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/student/submit-proposal', label: 'Submit Proposal', icon: FileText },
          { to: '/student/add-mentor', label: 'Choose Mentor', icon: UserPlus },
          { to: '/student/projects', label: 'My Projects', icon: FolderGit2 },
          { to: '/student/reviews', label: 'Reviews & Attendance', icon: Award },
          { to: '/student/calendar', label: 'Calendar', icon: Calendar },
          { to: '/student/notifications', label: 'Notifications', icon: Bell },
          { to: '/profile', label: 'My Profile', icon: User }
        ];

      case 'guide':
        return [
          { to: '/guide/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/guide/proposals', label: 'Review Proposals', icon: FileText },
          { to: '/guide/teams', label: 'My Teams', icon: FolderGit2 },
          { to: '/guide/reviews', label: 'Schedule Review', icon: Award },
          { to: '/guide/calendar', label: 'Academic Calendar', icon: Calendar },
          { to: '/guide/notifications', label: 'Notifications', icon: Bell },
          { to: '/profile', label: 'My Profile', icon: User }
        ];

      case 'hod':
        return [
          { to: '/hod/dashboard', label: 'Department Dashboard', icon: LayoutDashboard },
          { to: '/hod/projects', label: 'All Projects', icon: FolderGit2 },
          { to: '/hod/allocations', label: 'Guide Allocations', icon: Users },
          { to: '/hod/topic-approvals', label: 'Topic Approvals', icon: FileText },
          { to: '/hod/reviews', label: 'Review Oversight', icon: Award },
          { to: '/hod/reports', label: 'Department Reports', icon: BarChart3 },
          { to: '/hod/notifications', label: 'Notifications', icon: Bell },
          { to: '/profile', label: 'My Profile', icon: User }
        ];

      case 'panel':
        return [
          { to: '/panel/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/panel/assigned-projects', label: 'Assigned Evaluations', icon: Award },
          { to: '/panel/calendar', label: 'Review Calendar', icon: Calendar },
          { to: '/panel/notifications', label: 'Notifications', icon: Bell },
          { to: '/profile', label: 'My Profile', icon: User }
        ];

      case 'admin':
        return [
          { to: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
          { to: '/admin/users', label: 'User Management', icon: Users },
          { to: '/admin/departments', label: 'Departments', icon: Building },
          { to: '/admin/projects', label: 'Project Records', icon: FolderGit2 },
          { to: '/admin/reviews', label: 'Review Schedules', icon: Award },
          { to: '/admin/announcements', label: 'Announcements', icon: Bell },
          { to: '/admin/reports', label: 'System Reports', icon: BarChart3 },
          { to: '/admin/settings', label: 'System Settings', icon: SettingsIcon },
          { to: '/profile', label: 'My Profile', icon: User }
        ];

      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-lg-none"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1015 }}
          onClick={onClose}
        />
      )}

      <aside className={`pa-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <Link to="/" className="pa-sidebar-brand" onClick={onClose}>
          <div
            className="d-flex align-items-center justify-content-center rounded p-2"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
          >
            <GraduationCap size={22} className="text-white" />
          </div>
          <div>
            <div className="fw-bold fs-5 tracking-wide text-white">ProjAxis</div>
            <div className="small text-white-50 text-truncate" style={{ maxWidth: '160px', fontSize: '0.72rem' }}>
              {collegeName}
            </div>
          </div>
        </Link>

        {/* Multi-role Switcher if user has multiple roles */}
        {user && user.roles.length > 1 && (
          <div className="px-3 py-2 border-bottom border-white-10">
            <label className="text-white-50 small mb-1 d-block" style={{ fontSize: '0.75rem' }}>
              Active Role Switcher
            </label>
            <select
              className="form-select form-select-sm bg-dark text-white border-secondary"
              value={activeRole}
              onChange={(e) => switchRole(e.target.value)}
            >
              {user.roles.map((r) => (
                <option key={r} value={r}>
                  {r.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-grow-1 py-3 overflow-y-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `pa-nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer User Info */}
        <div className="p-3 border-top border-white-10 d-flex align-items-center gap-2">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
            style={{ width: '34px', height: '34px', backgroundColor: 'var(--color-academic-blue)' }}
          >
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden flex-grow-1">
            <div className="small text-white fw-medium text-truncate">{user?.name}</div>
            <div className="text-white-50 text-truncate" style={{ fontSize: '0.75rem' }}>
              {activeRole?.toUpperCase()}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
