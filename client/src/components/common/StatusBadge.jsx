import React from 'react';

const STATUS_CONFIGS = {
  // Proposals
  Draft: { bg: '#EAF2FB', color: '#2F65A7', label: 'Draft' },
  Submitted: { bg: '#EAF2FB', color: '#17365D', label: 'Submitted' },
  'With Guide': { bg: '#FFF7E6', color: '#C58B24', label: 'With Guide' },
  'Guide Approved': { bg: '#EBF8F2', color: '#27856A', label: 'Guide Approved' },
  'Revision Required': { bg: '#FFF7E6', color: '#C58B24', label: 'Revision Required' },
  Approved: { bg: '#EBF8F2', color: '#27856A', label: 'Approved' },
  Rejected: { bg: '#FDECEC', color: '#C94C4C', label: 'Rejected' },

  // Projects
  Active: { bg: '#EBF8F2', color: '#27856A', label: 'Active' },
  'On Hold': { bg: '#FFF7E6', color: '#C58B24', label: 'On Hold' },
  'Final Submitted': { bg: '#EAF2FB', color: '#2F65A7', label: 'Final Submitted' },
  'Under Evaluation': { bg: '#FFF7E6', color: '#C58B24', label: 'Under Evaluation' },
  Completed: { bg: '#EBF8F2', color: '#27856A', label: 'Completed' },
  Cancelled: { bg: '#FDECEC', color: '#C94C4C', label: 'Cancelled' },

  // Tasks
  'To Do': { bg: '#F5F7FA', color: '#64748B', label: 'To Do' },
  'In Progress': { bg: '#EAF2FB', color: '#2F65A7', label: 'In Progress' },
  'Under Review': { bg: '#FFF7E6', color: '#C58B24', label: 'Under Review' },
  Blocked: { bg: '#FDECEC', color: '#C94C4C', label: 'Blocked' },
  Done: { bg: '#EBF8F2', color: '#27856A', label: 'Done' },

  // Priorities
  Highest: { bg: '#FDECEC', color: '#C94C4C', label: 'Highest' },
  High: { bg: '#FFF7E6', color: '#C58B24', label: 'High' },
  Medium: { bg: '#EAF2FB', color: '#2F65A7', label: 'Medium' },
  Low: { bg: '#F5F7FA', color: '#64748B', label: 'Low' },
  Lowest: { bg: '#F5F7FA', color: '#94A3B8', label: 'Lowest' },

  // Attendance
  Present: { bg: '#EBF8F2', color: '#27856A', label: 'Present' },
  Absent: { bg: '#FDECEC', color: '#C94C4C', label: 'Absent' },
  Excused: { bg: '#FFF7E6', color: '#C58B24', label: 'Excused' },

  // Evaluations
  Published: { bg: '#EBF8F2', color: '#27856A', label: 'Published' },

  // Account
  'Pending Approval': { bg: '#FFF7E6', color: '#C58B24', label: 'Pending Approval' },
  Inactive: { bg: '#FDECEC', color: '#C94C4C', label: 'Inactive' }
};

const StatusBadge = ({ status, className = '' }) => {
  const config = STATUS_CONFIGS[status] || {
    bg: '#F5F7FA',
    color: '#64748B',
    label: status || 'Unknown'
  };

  return (
    <span
      className={`badge ${className}`}
      style={{
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.color}33`,
        fontSize: '0.78rem',
        fontWeight: 500
      }}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
