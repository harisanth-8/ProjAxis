import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import ErrorBoundary from '../components/common/ErrorBoundary';

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="d-flex min-vh-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="d-flex flex-column flex-grow-1 overflow-x-hidden">
        <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-grow-1 p-3 p-md-4">
          <div className="container-fluid px-0">
            <ErrorBoundary key={location.pathname} resetKey={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
