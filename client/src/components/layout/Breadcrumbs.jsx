import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const ROUTE_LABELS = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  proposals: 'Proposals',
  submit: 'Submit Proposal',
  mentor: 'Add Mentor',
  reviews: 'Reviews & Attendance',
  calendar: 'Calendar',
  notifications: 'Notifications',
  profile: 'Profile',
  users: 'User Management',
  departments: 'Departments',
  reports: 'Reports',
  settings: 'Settings',
  tasks: 'Tasks',
  evaluations: 'Evaluations'
};

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav aria-label="breadcrumb">
      <ol className="breadcrumb mb-0">
        <li className="breadcrumb-item">
          <Link to="/">Home</Link>
        </li>
        {pathnames.map((segment, index) => {
          const isLast = index === pathnames.length - 1;
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
          const label = ROUTE_LABELS[segment.toLowerCase()] || segment;

          return isLast ? (
            <li key={routeTo} className="breadcrumb-item active" aria-current="page">
              {label}
            </li>
          ) : (
            <li key={routeTo} className="breadcrumb-item">
              <Link to={routeTo}>{label}</Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
