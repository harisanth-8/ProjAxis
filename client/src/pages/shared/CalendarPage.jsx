import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import { Calendar as CalendarIcon, Plus, Filter, Clock, MapPin, Tag } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import FormField from '../../components/common/FormField';
import Spinner from '../../components/common/Spinner';

const CalendarPage = () => {
  const { user, activeRole } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterType, setFilterType] = useState('ALL');

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'Meeting',
    startAt: '',
    endAt: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const canCreate = activeRole === 'guide' || activeRole === 'hod' || activeRole === 'admin';

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/calendar/events');
      setEvents(res.data || []);
    } catch (err) {
      console.error('Failed to load calendar events', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.startAt || !formData.endAt) return;
    if (new Date(formData.endAt) <= new Date(formData.startAt)) {
      setError('Event end time must be after start time.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.post('/calendar/events', formData);
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        eventType: 'Meeting',
        startAt: '',
        endAt: ''
      });
      fetchEvents();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create calendar event');
    } finally {
      setSubmitting(false);
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'Review':
        return '#2F65A7'; // Academic Blue
      case 'Deadline':
      case 'Weekly Report':
        return '#C94C4C'; // Error / Urgent red
      case 'Milestone':
        return '#C58B24'; // Warning yellow
      case 'Meeting':
        return '#27856A'; // Success green
      case 'Presentation':
        return '#17365D'; // Navy
      default:
        return '#64748B'; // Muted
    }
  };

  const calendarEvents = events
    .filter((e) => {
      if (filterType === 'ALL') return true;
      return e.eventType?.toLowerCase() === filterType.toLowerCase();
    })
    .map((e) => ({
      id: e.eventId || e._id,
      title: e.title,
      start: e.startAt || e.date,
      end: e.endAt,
      backgroundColor: getEventColor(e.eventType),
      borderColor: getEventColor(e.eventType),
      extendedProps: {
        description: e.description,
        eventType: e.eventType,
        projectId: e.projectId,
        venue: e.venue
      }
    }));

  return (
    <div className="pa-page">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Academic & Project Timetable</h2>
          <p className="text-muted small mb-0">
            Unified schedule displaying review dates, weekly report deadlines, milestones, and meeting presentations.
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={() => {
              setError(null);
              setShowCreateModal(true);
            }}
          >
            <Plus size={16} /> Schedule Session / Meeting
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="pa-card mb-4 p-3">
        <div className="d-flex flex-wrap align-items-center gap-2">
          <Filter size={16} className="text-muted" />
          <span className="small fw-semibold text-muted">Filter Events:</span>
          {['ALL', 'Review', 'Meeting', 'Presentation', 'Deadline', 'Milestone'].map((type) => (
            <button
              key={type}
              type="button"
              className={`btn btn-sm ${
                filterType === type ? 'btn-primary' : 'btn-outline-secondary'
              }`}
              onClick={() => setFilterType(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="pa-card text-center py-5">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="pa-card p-4">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,listMonth'
            }}
            events={calendarEvents}
            eventClick={(info) => {
              setSelectedEvent({
                title: info.event.title,
                start: info.event.start,
                end: info.event.end,
                ...info.event.extendedProps
              });
            }}
            height="auto"
          />
        </div>
      )}

      {/* Event Details Modal */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.title || 'Event Details'}
        size="md"
      >
        <div>
          <div className="d-flex align-items-center gap-2 mb-3">
            <span
              className="badge text-white px-2 py-1"
              style={{ backgroundColor: getEventColor(selectedEvent?.eventType) }}
            >
              {selectedEvent?.eventType}
            </span>
            {selectedEvent?.projectId && (
              <span className="badge bg-light text-dark border">
                Project:{' '}
                {typeof selectedEvent.projectId === 'object' && selectedEvent.projectId !== null
                  ? selectedEvent.projectId.projectId || selectedEvent.projectId.title
                  : selectedEvent.projectId}
              </span>
            )}
          </div>

          <div className="d-flex flex-column gap-2 mb-3">
            <div className="d-flex align-items-center gap-2 small text-dark">
              <Clock size={16} className="text-muted" />
              <span>
                <strong>Start:</strong> {selectedEvent?.start?.toLocaleString()}
              </span>
            </div>
            {selectedEvent?.end && (
              <div className="d-flex align-items-center gap-2 small text-dark">
                <Clock size={16} className="text-muted" />
                <span>
                  <strong>End:</strong> {selectedEvent.end.toLocaleString()}
                </span>
              </div>
            )}
            {selectedEvent?.venue && (
              <div className="d-flex align-items-center gap-2 small text-dark">
                <MapPin size={16} className="text-muted" />
                <span>
                  <strong>Venue:</strong> {selectedEvent.venue}
                </span>
              </div>
            )}
          </div>

          {selectedEvent?.description && (
            <div className="p-3 bg-light rounded border small text-muted">
              {selectedEvent.description}
            </div>
          )}

          <div className="d-flex justify-content-end mt-4">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setSelectedEvent(null)}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Schedule Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Schedule Session or Presentation"
        size="md"
      >
        <form onSubmit={handleCreate}>
          {error && <div className="alert alert-danger py-2 small">{error}</div>}

          <FormField label="Event Title" required>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Mid-term Progress Sync, Lab Presentation"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </FormField>

          <FormField label="Event Category" required>
            <select
              className="form-select"
              value={formData.eventType}
              onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
              required
            >
              <option value="Meeting">Faculty Guide Meeting</option>
              <option value="Presentation">Lab Demo / Presentation Session</option>
              <option value="Deadline">Project Task Deadline</option>
              <option value="Other">General Department Milestone</option>
            </select>
          </FormField>

          <div className="row g-2 mb-3">
            <div className="col-12 col-md-6">
              <FormField label="Start Date & Time" required>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={formData.startAt}
                  onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                  required
                />
              </FormField>
            </div>
            <div className="col-12 col-md-6">
              <FormField label="End Date & Time" required>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={formData.endAt}
                  onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                  required
                />
              </FormField>
            </div>
          </div>

          <FormField label="Agenda & Description">
            <textarea
              className="form-control"
              rows={3}
              placeholder="Discussion points and expectations..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </FormField>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Add to Calendar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CalendarPage;
