import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Filter, Clock, ArrowRight, ExternalLink } from 'lucide-react';
import api from '../../api/client';
import Spinner from '../../components/common/Spinner';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // 'ALL' or 'UNREAD'

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notif) => {
    try {
      await api.patch(`/notifications/${notif.notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === notif.notificationId ? { ...n, status: 'Read' } : n))
      );
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, status: 'Read' })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const getEntityLink = (notif) => {
    if (!notif.relatedEntityType || !notif.relatedEntityId) return null;
    switch (notif.relatedEntityType.toLowerCase()) {
      case 'project':
        return `/projects/${notif.relatedEntityId}`;
      case 'proposal':
        return `/guide/proposals?id=${notif.relatedEntityId}`;
      case 'review':
        return `/student/reviews`;
      case 'task':
        return `/projects/${notif.projectId || ''}`;
      default:
        return null;
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'UNREAD') return n.status === 'Unread';
    return true;
  });

  const unreadCount = notifications.filter((n) => n.status === 'Unread').length;

  return (
    <div className="pa-page">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Notifications & System Alerts</h2>
          <p className="text-muted small mb-0">
            Real-time milestone notifications, review schedules, evaluation publications, and team updates.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            className="btn btn-outline-primary d-flex align-items-center gap-2"
            onClick={handleMarkAllAsRead}
          >
            <CheckCheck size={16} /> Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      <div className="pa-card mb-4 p-3">
        <div className="d-flex align-items-center gap-2">
          <Filter size={16} className="text-muted" />
          <span className="small fw-semibold text-muted">Filter:</span>
          <button
            type="button"
            className={`btn btn-sm ${filter === 'ALL' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setFilter('ALL')}
          >
            All Notifications ({notifications.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filter === 'UNREAD' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setFilter('UNREAD')}
          >
            Unread Only ({unreadCount})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="pa-card text-center py-5 text-muted">
          No notifications to display.
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {filtered.map((n) => {
            const isUnread = n.status === 'Unread';
            const link = getEntityLink(n);

            return (
              <div
                key={n.notificationId}
                className={`pa-card p-3 transition ${
                  isUnread ? 'border-primary bg-primary-subtle' : 'bg-white'
                }`}
                style={{
                  borderLeft: isUnread ? '4px solid var(--color-primary)' : '1px solid var(--color-border)'
                }}
              >
                <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="badge bg-light text-dark border" style={{ fontSize: '0.72rem' }}>
                        {n.category || 'System'}
                      </span>
                      {isUnread && (
                        <span className="badge bg-primary" style={{ fontSize: '0.68rem' }}>
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="fw-medium text-dark mb-1">{n.message}</p>
                    <div className="d-flex align-items-center gap-1 text-muted small" style={{ fontSize: '0.75rem' }}>
                      <Clock size={12} />
                      <span>{new Date(n.date || n.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    {link && (
                      <Link
                        to={link}
                        className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                        onClick={() => isUnread && handleMarkAsRead(n)}
                      >
                        <span>View</span>
                        <ArrowRight size={13} />
                      </Link>
                    )}
                    {isUnread && (
                      <button
                        type="button"
                        className="btn btn-sm btn-light border"
                        onClick={() => handleMarkAsRead(n)}
                        title="Mark as read"
                      >
                        <CheckCheck size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
