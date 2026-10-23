import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Printer, Filter, FileText, CheckCircle, Clock } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import Spinner from '../../components/common/Spinner';

const DepartmentReports = () => {
  const [reportType, setReportType] = useState('project-status');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/${reportType}`);
      const raw = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data?.reportData)
        ? res.data.reportData
        : [];
      setReportData(raw);
    } catch (err) {
      console.error('Failed to load report data', err);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.get(`/reports/${reportType}?format=csv`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}-report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export CSV report');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const reportTitles = {
    'project-status': 'Department Project Status Summary',
    'guide-workload': 'Faculty Supervision & Workload Distribution',
    'proposal-pipeline': 'Proposal Approval Pipeline',
    'weekly-compliance': 'Weekly Progress Report Compliance',
    'task-completion': 'Task Milestone & Overdue Analysis',
    'marks-sheet': 'Consolidated Student Evaluation Marks Sheet'
  };

  return (
    <div className="pa-page">
      {/* Print-only Header */}
      <div className="d-none d-print-block mb-4">
        <h2>ProjAxis Academic Administration</h2>
        <h4>{reportTitles[reportType]}</h4>
        <p className="text-muted">Generated on {new Date().toLocaleString()}</p>
      </div>

      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 d-print-none">
        <div>
          <h2 className="fw-bold text-dark mb-1">Department Academic Reports</h2>
          <p className="text-muted small mb-0">
            Generate and export official audit reports, faculty workloads, weekly compliance, and marks sheets.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary d-flex align-items-center gap-2"
            onClick={handlePrint}
          >
            <Printer size={16} /> Print / Save as PDF
          </button>
          <button
            type="button"
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={handleExportCSV}
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="pa-card mb-4 p-3 d-print-none">
        <div className="d-flex flex-wrap align-items-center gap-3">
          <span className="fw-semibold text-dark small text-uppercase">Report Category:</span>
          <select
            className="form-select form-select-sm"
            style={{ width: 'auto', minWidth: '280px' }}
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="project-status">Project Status Summary</option>
            <option value="guide-workload">Faculty Supervision & Workload</option>
            <option value="proposal-pipeline">Proposal Approval Pipeline</option>
            <option value="weekly-compliance">Weekly Report Compliance</option>
            <option value="task-completion">Task Completion & Overdue Tasks</option>
            <option value="marks-sheet">Consolidated Marks Sheet</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner size="lg" />
        </div>
      ) : !Array.isArray(reportData) || reportData.length === 0 ? (
        <div className="pa-card text-center py-5 text-muted">
          No records found for the selected report category.
        </div>
      ) : (
        <div className="pa-card">
          <h5 className="fw-bold mb-3 border-bottom pb-2">{reportTitles[reportType]}</h5>
          <div className="table-responsive">
            <table className="table align-middle table-bordered">
              <thead className="table-light">
                {reportType === 'project-status' && (
                  <tr>
                    <th>Project ID</th>
                    <th>Title</th>
                    <th>Domain</th>
                    <th>Guide</th>
                    <th>Team Size</th>
                    <th>Status</th>
                  </tr>
                )}
                {reportType === 'guide-workload' && (
                  <tr>
                    <th>Faculty Name</th>
                    <th>Email</th>
                    <th>Active Projects</th>
                    <th>Capacity Cap</th>
                    <th>Status</th>
                  </tr>
                )}
                {reportType === 'proposal-pipeline' && (
                  <tr>
                    <th>Proposal ID</th>
                    <th>Title</th>
                    <th>Assigned Guide</th>
                    <th>Submission Date</th>
                    <th>Approval Status</th>
                  </tr>
                )}
                {reportType === 'weekly-compliance' && (
                  <tr>
                    <th>Project ID</th>
                    <th>Project Title</th>
                    <th>Guide</th>
                    <th>Reports Submitted</th>
                    <th>Latest Report Week</th>
                    <th>Compliance</th>
                  </tr>
                )}
                {reportType === 'task-completion' && (
                  <tr>
                    <th>Project ID</th>
                    <th>Project Title</th>
                    <th>Total Tasks</th>
                    <th>Done</th>
                    <th>Overdue</th>
                    <th>Completion %</th>
                  </tr>
                )}
                {reportType === 'marks-sheet' && (
                  <tr>
                    <th>Student Reg No</th>
                    <th>Student Name</th>
                    <th>Project ID</th>
                    <th>Review Type</th>
                    <th>Average Marks</th>
                    <th>Final Grade</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {reportData.map((row, idx) => (
                  <tr key={idx}>
                    {reportType === 'project-status' && (
                      <>
                        <td className="fw-bold">{row.projectId}</td>
                        <td>{row.title}</td>
                        <td>{row.domain}</td>
                        <td>{row.guideName || 'Unassigned'}</td>
                        <td>{row.teamSize || 1}</td>
                        <td>
                          <StatusBadge status={row.status} />
                        </td>
                      </>
                    )}
                    {reportType === 'guide-workload' && (
                      <>
                        <td className="fw-bold">{row.name}</td>
                        <td>{row.email}</td>
                        <td>{row.activeProjectsCount || 0}</td>
                        <td>{row.capacityLimit || 8}</td>
                        <td>
                          {row.activeProjectsCount >= (row.capacityLimit || 8) ? (
                            <span className="badge bg-danger-subtle text-danger border">At Capacity</span>
                          ) : (
                            <span className="badge bg-success-subtle text-success border">Available</span>
                          )}
                        </td>
                      </>
                    )}
                    {reportType === 'proposal-pipeline' && (
                      <>
                        <td className="fw-bold">{row.proposalId}</td>
                        <td>{row.title}</td>
                        <td>{row.assignedGuideName || 'None'}</td>
                        <td>{new Date(row.submissionDate).toLocaleDateString()}</td>
                        <td>
                          <StatusBadge status={row.approvalStatus} />
                        </td>
                      </>
                    )}
                    {reportType === 'weekly-compliance' && (
                      <>
                        <td className="fw-bold">{row.projectId}</td>
                        <td>{row.title}</td>
                        <td>{row.guideName}</td>
                        <td>{row.submittedReportsCount}</td>
                        <td>Week {row.latestWeekNo || '-'}</td>
                        <td>
                          <span
                            className={`badge ${
                              row.isCompliant ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'
                            } border`}
                          >
                            {row.isCompliant ? 'Compliant' : 'Missing Reports'}
                          </span>
                        </td>
                      </>
                    )}
                    {reportType === 'task-completion' && (
                      <>
                        <td className="fw-bold">{row.projectId}</td>
                        <td>{row.title}</td>
                        <td>{row.totalTasks}</td>
                        <td className="text-success fw-bold">{row.doneTasks}</td>
                        <td className="text-danger fw-bold">{row.overdueTasks}</td>
                        <td>{row.totalTasks > 0 ? `${Math.round((row.doneTasks / row.totalTasks) * 100)}%` : 'No tasks'}</td>
                      </>
                    )}
                    {reportType === 'marks-sheet' && (
                      <>
                        <td className="fw-bold">{row.regNo}</td>
                        <td>{row.studentName}</td>
                        <td>{row.projectId}</td>
                        <td>{row.reviewType}</td>
                        <td className="fw-bold text-primary">{row.marks}</td>
                        <td>
                          <span className="badge bg-dark text-white">{row.grade}</span>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentReports;
