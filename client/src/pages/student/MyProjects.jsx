import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import DataTable from '../../components/common/DataTable';
import FilterBar from '../../components/common/FilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import { ArrowRight, FolderGit2 } from 'lucide-react';

const MyProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.q = search;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/projects', { params });
      setProjects(res.data || []);
      setPagination(res.meta);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [page, statusFilter]);

  const handleSearchSubmit = () => {
    setPage(1);
    fetchProjects();
  };

  const columns = [
    {
      key: 'projectId',
      label: 'Project ID',
      width: '140px',
      render: (row) => (
        <span className="fw-bold" style={{ color: 'var(--color-navy)' }}>
          {row.projectId}
        </span>
      )
    },
    {
      key: 'title',
      label: 'Title & Domain',
      render: (row) => (
        <div>
          <div className="fw-semibold text-truncate" style={{ maxWidth: '320px' }}>
            {row.title}
          </div>
          <div className="text-muted small">{row.domain}</div>
        </div>
      )
    },
    {
      key: 'guideId',
      label: 'Guide',
      render: (row) => (
        <div className="small">
          <div className="fw-medium">{row.guideId?.name || 'Assigned Guide'}</div>
          <div className="text-muted text-xs">{row.guideId?.email}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      width: '130px',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      key: 'taskProgress',
      label: 'Task Progress',
      width: '130px',
      render: (row) => (
        <span className="small fw-semibold">{row.computedMetrics?.taskProgress}</span>
      )
    },
    {
      key: 'actions',
      label: 'Action',
      width: '100px',
      render: (row) => (
        <Link
          to={`/student/projects/${row._id}`}
          className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
        >
          Workspace <ArrowRight size={14} />
        </Link>
      )
    }
  ];

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: 'var(--color-navy)' }}>My Projects</h4>
          <div className="text-muted small">View all active and archived capstone projects you belong to</div>
        </div>
      </div>

      <FilterBar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search project by title, ID, or domain..."
        filters={[
          {
            label: 'All Statuses',
            value: statusFilter,
            onChange: (val) => { setStatusFilter(val); setPage(1); },
            options: [
              { label: 'Active', value: 'Active' },
              { label: 'On Hold', value: 'On Hold' },
              { label: 'Final Submitted', value: 'Final Submitted' },
              { label: 'Under Evaluation', value: 'Under Evaluation' },
              { label: 'Completed', value: 'Completed' }
            ]
          }
        ]}
        onClearFilters={() => {
          setSearch('');
          setStatusFilter('');
          setPage(1);
        }}
      />

      <DataTable
        columns={columns}
        data={projects}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        emptyTitle="No Projects Found"
        emptyDescription="You have no active projects yet. Submit a proposal to start."
      />
    </div>
  );
};

export default MyProjects;
