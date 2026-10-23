import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Breadcrumbs from './Breadcrumbs';
import api from '../../api/client';
import { Menu, Bell, User, LogOut, KeyRound } from 'lucide-react';

const Topbar = ({ onToggleSidebar }) => {
  const { user, activeRole, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications/unread-count');
        if (res.data?.count !== undefined) {
          setUnreadCount(res.data.count);
        }
      } catch {
        // silent fail
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="pa-topbar d-flex align-items-center justify-content-between">
      {/* Left side: Mobile Toggle & Breadcrumbs */}
      <div className="d-flex align-items-center gap-3">
        <button
          className="btn btn-sm btn-outline-secondary d-lg-none"
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={18} />
        </button>
        <Breadcrumbs />
      </div>

      {/* Right side: Notifications & Profile Menu */}
      <div className="d-flex align-items-center gap-3">
        {/* Notification Bell */}
        <Link
          to={`/${activeRole}/notifications`}
          className="btn btn-sm btn-outline-secondary position-relative p-2 border-0"
          title="Notifications"
        >
          <Bell size={20} className="text-secondary" />
          {unreadCount > 0 && (
            <span
              className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
              style={{ fontSize: '0.65rem' }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User Profile Dropdown */}
        <div className="position-relative">
          <button
            className="btn btn-sm btn-light border d-flex align-items-center gap-2 px-2 py-1"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white small"
              style={{ width: '26px', height: '26px', backgroundColor: 'var(--color-navy)' }}
            >
              {user?.name?.charAt(0) || 'U'}
            </div>
            <span className="small fw-medium d-none d-md-inline">{user?.name}</span>
          </button>

          {showProfileMenu && (
            <>
              <div
                className="position-fixed top-0 start-0 w-100 h-100"
                style={{ zIndex: 1040 }}
                onClick={() => setShowProfileMenu(false)}
              />
              <div
                className="position-absolute end-0 mt-2 card shadow-sm p-2 border"
                style={{ width: '220px', zIndex: 1050 }}
              >
                <div className="p-2 border-bottom mb-1">
                  <div className="small fw-bold text-truncate">{user?.name}</div>
                  <div className="text-muted small text-truncate">{user?.email}</div>
                  <span className="badge bg-secondary mt-1">{activeRole?.toUpperCase()}</span>
                </div>

                <Link
                  to="/profile"
                  className="dropdown-item py-2 px-2 small rounded d-flex align-items-center gap-2"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <User size={15} /> My Profile
                </Link>

                <Link
                  to="/change-password"
                  className="dropdown-item py-2 px-2 small rounded d-flex align-items-center gap-2"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <KeyRound size={15} /> Change Password
                </Link>

                <div className="border-top my-1" />

                <button
                  className="dropdown-item py-2 px-2 small rounded text-danger d-flex align-items-center gap-2"
                  onClick={handleLogout}
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
