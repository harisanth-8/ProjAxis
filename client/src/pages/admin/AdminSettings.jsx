import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, Shield, AlertCircle } from 'lucide-react';
import api from '../../api/client';
import FormField from '../../components/common/FormField';
import Spinner from '../../components/common/Spinner';

const AdminSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      setSettings(res.data);
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await api.patch('/settings', settings);
      setSuccessMsg('Platform settings successfully saved and applied globally!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="pa-page text-center py-5">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="pa-page">
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">System Configuration & Academic Policies</h2>
        <p className="text-muted small mb-0">
          Configure institutional approval workflows, grading rubrics, faculty capacity caps, and document restrictions.
        </p>
      </div>

      {successMsg && <div className="alert alert-success py-2">{successMsg}</div>}
      {error && <div className="alert alert-danger py-2">{error}</div>}

      <form onSubmit={handleSave}>
        <div className="row g-4">
          {/* General & Branding */}
          <div className="col-12 col-lg-6">
            <div className="pa-card h-100">
              <h5 className="fw-bold mb-3 border-bottom pb-2">Institutional Branding</h5>

              <FormField label="College / Institute Name" required>
                <input
                  type="text"
                  className="form-control"
                  value={settings?.collegeName || ''}
                  onChange={(e) => setSettings({ ...settings, collegeName: e.target.value })}
                  required
                />
              </FormField>

              <FormField label="Current Academic Year" required>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 2026-2027"
                  value={settings?.academicYear || '2026-2027'}
                  onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
                  required
                />
              </FormField>

              <FormField label="Proposal Approval Workflow" required>
                <select
                  className="form-select"
                  value={settings?.approvalMode || 'Guide + HOD'}
                  onChange={(e) => setSettings({ ...settings, approvalMode: e.target.value })}
                  required
                >
                  <option value="Guide + HOD">Two-Tier: Guide Endorsement + HOD Sanction (Default)</option>
                  <option value="Guide only">Single-Tier: Guide Approval Only</option>
                </select>
                <span className="text-muted small">
                  In Guide + HOD mode, approved topics must receive final sanction from the department head before active project creation.
                </span>
              </FormField>
            </div>
          </div>

          {/* Limits & Capacity */}
          <div className="col-12 col-lg-6">
            <div className="pa-card h-100">
              <h5 className="fw-bold mb-3 border-bottom pb-2">Faculty & File Limits</h5>

              <FormField label="Faculty Guide Supervision Capacity Cap" required>
                <input
                  type="number"
                  min="1"
                  max="50"
                  className="form-control"
                  value={settings?.guideCapacityCap || 8}
                  onChange={(e) => setSettings({ ...settings, guideCapacityCap: Number(e.target.value) })}
                  required
                />
                <span className="text-muted small">
                  Maximum number of student project teams a single faculty guide may supervise without explicit HOD justification.
                </span>
              </FormField>

              <FormField label="Max File Upload Limit (MB)" required>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="form-control"
                  value={settings?.fileLimitMB || 10}
                  onChange={(e) => setSettings({ ...settings, fileLimitMB: Number(e.target.value) })}
                  required
                />
              </FormField>

              <FormField label="Allowed Document File Extensions">
                <input
                  type="text"
                  className="form-control"
                  value={settings?.allowedFileTypes?.join(', ') || 'pdf, doc, docx, ppt, pptx, zip, png, jpg'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      allowedFileTypes: e.target.value.split(',').map((x) => x.trim())
                    })
                  }
                />
              </FormField>
            </div>
          </div>

          {/* Deadlines */}
          <div className="col-12">
            <div className="pa-card">
              <h5 className="fw-bold mb-3 border-bottom pb-2">Institutional Deadlines & Weekly Cycles</h5>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <FormField label="Topic Proposal Submission Deadline">
                    <input
                      type="date"
                      className="form-control"
                      value={settings?.proposalDeadline ? new Date(settings.proposalDeadline).toISOString().slice(0, 10) : ''}
                      onChange={(e) => setSettings({ ...settings, proposalDeadline: e.target.value })}
                    />
                  </FormField>
                </div>
                <div className="col-12 col-md-6">
                  <FormField label="Weekly Progress Report Cutoff Day">
                    <select
                      className="form-select"
                      value={settings?.weeklyReportDeadlineDay || 'Sunday'}
                      onChange={(e) => setSettings({ ...settings, weeklyReportDeadlineDay: e.target.value })}
                    >
                      <option value="Sunday">Sunday 23:59 IST</option>
                      <option value="Monday">Monday 23:59 IST</option>
                      <option value="Friday">Friday 17:00 IST</option>
                      <option value="Saturday">Saturday 23:59 IST</option>
                    </select>
                  </FormField>
                </div>
              </div>
            </div>
          </div>

          {/* Grade Scale Reference */}
          <div className="col-12">
            <div className="pa-card">
              <h5 className="fw-bold mb-3 border-bottom pb-2">Academic Grade Scale Matrix (Fixed College Policy)</h5>
              <div className="table-responsive">
                <table className="table table-bordered align-middle text-center">
                  <thead className="table-light">
                    <tr>
                      <th>Grade O</th>
                      <th>Grade A+</th>
                      <th>Grade A</th>
                      <th>Grade B+</th>
                      <th>Grade B</th>
                      <th>Grade C</th>
                      <th>Fail</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="fw-bold text-success">90 - 100</td>
                      <td className="fw-bold text-success">80 - 89</td>
                      <td className="fw-bold text-primary">70 - 79</td>
                      <td className="fw-bold text-info">60 - 69</td>
                      <td className="fw-bold text-secondary">50 - 59</td>
                      <td className="fw-bold text-warning">40 - 49</td>
                      <td className="fw-bold text-danger">&lt; 40</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-end mt-4">
          <button
            type="submit"
            className="btn btn-primary d-flex align-items-center gap-2"
            disabled={saving}
          >
            <Save size={16} />
            <span>{saving ? 'Saving Settings...' : 'Save System Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
