import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FolderGit2,
  LayoutDashboard,
  CheckSquare,
  Kanban,
  GitCommit,
  Layers,
  Users,
  History,
  FileText,
  MessageSquare,
  Award,
  ChevronLeft
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import Spinner from '../../components/common/Spinner';

// Workspace Tabs
import WorkspaceSummary from '../../components/projects/WorkspaceSummary';
import TaskList from '../../components/tasks/TaskList';
import KanbanBoard from '../../components/board/KanbanBoard';
import TimelineGantt from '../../components/timeline/TimelineGantt';
import MilestonesWorkstreams from '../../components/projects/MilestonesWorkstreams';
import TeamWorkload from '../../components/projects/TeamWorkload';
import ProjectActivity from '../../components/projects/ProjectActivity';
import ProjectDocuments from '../../components/projects/ProjectDocuments';

const ProjectDetail = () => {
  const { id } = useParams();
  const { user, activeRole } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="pa-page text-center py-5">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="pa-page">
        <div className="alert alert-danger">{error || 'Project not found or access denied.'}</div>
        <Link to="/" className="btn btn-outline-primary d-inline-flex align-items-center gap-1">
          <ChevronLeft size={16} /> Return to Dashboard
        </Link>
      </div>
    );
  }

  const isStudent = activeRole === 'student';
  const isGuide = activeRole === 'guide';
  const isAdmin = activeRole === 'admin';
  const isHod = activeRole === 'hod';

  // Permission rules:
  // Students on team can create tasks, change task status (except Done).
  // Guides and Admins have full management (milestones, workstreams, set Done, etc.)
  const canManage = isGuide || isAdmin;
  const canCreateTask = isStudent || isGuide || isAdmin;

  const tabs = [
    { id: 'summary', label: 'Summary', icon: LayoutDashboard },
    { id: 'tasks', label: 'Task List', icon: CheckSquare },
    { id: 'board', label: 'Board', icon: Kanban },
    { id: 'timeline', label: 'Timeline', icon: GitCommit },
    { id: 'milestones', label: 'Milestones & Phases', icon: Layers },
    { id: 'workload', label: 'Team Workload', icon: Users },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'activity', label: 'Audit Activity', icon: History }
  ];

  return (
    <div className="pa-page">
      {/* Header Bar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge bg-dark text-white px-2 py-1" style={{ fontSize: '0.75rem' }}>
              {project.projectId}
            </span>
            <StatusBadge status={project.status} />
            <span className="text-muted small">Academic Year: {project.academicYear}</span>
          </div>
          <h3 className="fw-bold text-dark mb-0">{project.title}</h3>
          <p className="text-muted small mb-0 mt-1">Domain: {project.domain}</p>
        </div>

        {/* Action badges / quick links */}
        <div className="d-flex align-items-center gap-2">
          {isStudent && project.status === 'Active' && (
            <Link to={`/student/final-submission?projectId=${project.projectId}`} className="btn btn-sm btn-outline-success">
              Final Project Submission
            </Link>
          )}
          {isStudent && (
            <Link to={`/student/submit-weekly-report?projectId=${project.projectId}`} className="btn btn-sm btn-outline-primary">
              Submit Weekly Report
            </Link>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-bottom mb-4">
        <ul className="nav nav-tabs border-0 flex-nowrap overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <li key={tab.id} className="nav-item">
                <button
                  type="button"
                  className={`nav-link d-flex align-items-center gap-2 text-nowrap py-2 px-3 ${
                    isActive ? 'active fw-bold text-primary border-bottom border-primary border-2' : 'text-secondary'
                  }`}
                  style={{ borderRadius: '0', background: 'transparent' }}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'summary' && (
          <WorkspaceSummary project={project} onRefresh={fetchProject} />
        )}

        {activeTab === 'tasks' && (
          <TaskList
            project={project}
            canCreate={canCreateTask}
            canManage={canManage}
            onRefresh={fetchProject}
          />
        )}

        {activeTab === 'board' && (
          <KanbanBoard
            project={project}
            canManage={canManage}
            onRefresh={fetchProject}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineGantt project={project} />
        )}

        {activeTab === 'milestones' && (
          <MilestonesWorkstreams
            project={project}
            canManage={canManage}
            onRefresh={fetchProject}
          />
        )}

        {activeTab === 'workload' && (
          <TeamWorkload project={project} />
        )}

        {activeTab === 'documents' && (
          <ProjectDocuments
            projectId={project.projectId}
            canUpload={true}
            canDelete={isAdmin}
          />
        )}

        {activeTab === 'activity' && (
          <ProjectActivity projectId={project.projectId} />
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;
