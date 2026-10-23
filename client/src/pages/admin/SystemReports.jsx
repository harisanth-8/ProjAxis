import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Printer, Filter } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import Spinner from '../../components/common/Spinner';

const SystemReports = () => {
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
      link.setAttribute('download', `system-${reportType}-report.csv`);
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

  return (
    <div className="pa-page">
      {/* Print-only Header */}
      <div className="d-none d-print-block mb-4">
        <h2>ProjAxis Institutional Administration</h2>
        <h4>Institution-Wide Audit & Performance Report</h4>
        <p className="text-muted">Generated on {new Date().toLocaleString()}</p>
      </div>

      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 d-print-none">
        <div>
          <h2 className="fw-bold text-dark mb-1">Institution-Wide System Reports</h2>
          <p className="text-muted small mb-0">
            Generate cross-department project summaries, supervisor allocations, compliance, and academic records.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary d-flex align-items-center gap-2"
            onClick={handlePrint}
          >
            <Printer size={16} /> Print / PDF
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

      {/* Selector */}
      <div className="pa-card mb-4 p-3 d-print-none">
        <div className="d-flex flex-wrap align-items-center gap-3">
          <span className="fw-semibold text-dark small text-uppercase">Report Scope:</span>
          <select
            className="form-select form-select-sm"
            style={{ width: 'auto', minWidth: '280px' }}
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="project-status">Project Status Summary</option>
            <option value="guide-workload">Faculty Supervision Workloads</option>
            <option value="proposal-pipeline">Proposal Pipeline</option>
            <option value="weekly-compliance">Weekly Progress Compliance</option>
            <option value="task-completion">Task Completion Analysis</option>
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
          <div className="table-responsive">
            <table className="table align-middle table-bordered">
              <thead className="table-light">
                <tr>
                  {Object.keys(reportData[0] || {}).map((key) => (
                    <th key={key} className="text-capitalize">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, idx) => (
                  <tr key={idx}>
                    {Object.values(row).map((val, vIdx) => (
                      <td key={vIdx} className="small">
                        {typeof val === 'boolean'
                          ? val ? 'Yes' : 'No'
                          : typeof val === 'object' && val !== null
                          ? JSON.stringify(val)
                          : String(val ?? '-')}
                      </td>
                    ))}
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

export default SystemReports;
