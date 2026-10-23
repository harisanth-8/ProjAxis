import React, { useState, useEffect } from 'react';
import { Building, Plus, Edit2, Search } from 'lucide-react';
import api from '../../api/client';
import Modal from '../../components/common/Modal';
import FormField from '../../components/common/FormField';
import Spinner from '../../components/common/Spinner';

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/departments');
      setDepartments(res.data || []);
    } catch (err) {
      console.error('Failed to load departments', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingDept(null);
    setFormData({ name: '', code: '', description: '' });
    setError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (d) => {
    setEditingDept(d);
    setFormData({
      name: d.name,
      code: d.code,
      description: d.description || ''
    });
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      if (editingDept) {
        await api.patch(`/departments/${editingDept.departmentId || editingDept._id}`, formData);
      } else {
        await api.post('/departments', formData);
      }
      setShowModal(false);
      fetchDepartments();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pa-page">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Academic Departments</h2>
          <p className="text-muted small mb-0">
            Define institutional faculties, department codes, and organizational structures.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={handleOpenCreate}
        >
          <Plus size={16} /> Add Department
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner size="lg" />
        </div>
      ) : departments.length === 0 ? (
        <div className="pa-card text-center py-5 text-muted">
          No departments registered yet. Click "Add Department" to get started.
        </div>
      ) : (
        <div className="row g-4">
          {departments.map((dept) => (
            <div key={dept.code} className="col-12 col-md-6 col-xl-4">
              <div className="pa-card h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="badge bg-primary px-3 py-1 fs-6">{dept.code}</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => handleOpenEdit(dept)}
                      title="Edit department"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                  <h5 className="fw-bold text-dark mt-2">{dept.name}</h5>
                  <p className="text-muted small mb-3">{dept.description || 'No description provided.'}</p>
                </div>
                <div className="pt-2 border-top text-muted small">
                  Registered Department
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingDept ? `Edit Department: ${editingDept.code}` : 'Add Academic Department'}
        size="md"
      >
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-danger py-2 small">{error}</div>}

          <FormField label="Department Name" required>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Computer Science and Engineering"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </FormField>

          <FormField label="Department Code" required>
            <input
              type="text"
              className="form-control text-uppercase"
              placeholder="e.g. CSE, ECE, MECH"
              value={formData.code}
              disabled={!!editingDept}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              required
            />
          </FormField>

          <FormField label="Description">
            <textarea
              className="form-control"
              rows={3}
              placeholder="Program overview and scope..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </FormField>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editingDept ? 'Update Department' : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DepartmentManagement;
