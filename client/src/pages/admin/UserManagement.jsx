import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Filter, CheckCircle, XCircle, Edit2, ShieldAlert } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import FormField from '../../components/common/FormField';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Spinner from '../../components/common/Spinner';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Create / Edit User Modal
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    roles: ['student'],
    departmentId: '',
    temporaryPassword: '',
    accountStatus: 'Active'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Status toggle confirmation
  const [userToToggle, setUserToToggle] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, dRes] = await Promise.all([
        api.get('/users?limit=100'),
        api.get('/departments')
      ]);
      setUsers(uRes.data || []);
      setDepartments(dRes.data || []);
      if (dRes.data?.length > 0 && !formData.departmentId) {
        setFormData((prev) => ({ ...prev, departmentId: dRes.data[0]._id || dRes.data[0].departmentId }));
      }
    } catch (err) {
      console.error('Failed to load user management data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      roles: ['student'],
      departmentId: departments[0]?._id || '',
      temporaryPassword: 'Password@123',
      accountStatus: 'Active'
    });
    setError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setFormData({
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      roles: u.roles || ['student'],
      departmentId: u.departmentId?._id || u.departmentId || '',
      temporaryPassword: '',
      accountStatus: u.accountStatus || 'Active'
    });
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (editingUser) {
        await api.patch(`/users/${editingUser.userId}`, {
          name: formData.name,
          phone: formData.phone,
          roles: formData.roles,
          departmentId: formData.departmentId,
          accountStatus: formData.accountStatus
        });
      } else {
        await api.post('/users', formData);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveRegistration = async (u) => {
    try {
      await api.patch(`/users/${u.userId}`, {
        accountStatus: 'Active'
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to approve user');
    }
  };

  const handleToggleStatus = async () => {
    if (!userToToggle) return;
    try {
      const newStatus = userToToggle.accountStatus === 'Active' ? 'Inactive' : 'Active';
      await api.patch(`/users/${userToToggle.userId}`, {
        accountStatus: newStatus
      });
      setUserToToggle(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to toggle account status');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.userId?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.roles?.includes(roleFilter);
    const matchesStatus = statusFilter === 'ALL' || u.accountStatus === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="pa-page">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">User & Role Management</h2>
          <p className="text-muted small mb-0">
            Provision accounts, approve pending registrations, assign roles, and manage institutional access privileges.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={handleOpenCreate}
        >
          <Plus size={16} /> Create New User
        </button>
      </div>

      {/* Filter Bar */}
      <div className="pa-card mb-4 p-3">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-5 col-lg-4">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <Search size={16} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by name, email, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-6 col-md-3 col-lg-3">
            <select
              className="form-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="ALL">All Roles</option>
              <option value="student">Student</option>
              <option value="guide">Guide</option>
              <option value="hod">HOD</option>
              <option value="panel">Review Panel</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          <div className="col-6 col-md-4 col-lg-3">
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="col-12 col-lg-2 text-lg-end text-muted small">
            {filteredUsers.length} Users
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner size="lg" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="pa-card text-center py-5 text-muted">
          No users match the search and filter criteria.
        </div>
      ) : (
        <div className="pa-card">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead className="table-light">
                <tr>
                  <th>User Details</th>
                  <th>Roles</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.userId}>
                    <td>
                      <div className="fw-bold text-dark">{u.name}</div>
                      <div className="text-muted small">{u.email}</div>
                      <span className="badge bg-light text-muted border mt-1" style={{ fontSize: '0.7rem' }}>
                        {u.userId}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {u.roles?.map((r) => (
                          <span key={r} className="badge bg-secondary text-uppercase" style={{ fontSize: '0.7rem' }}>
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="small text-muted">{u.department?.name || u.departmentId?.name || 'Department'}</td>
                    <td>
                      <StatusBadge status={u.accountStatus} />
                    </td>
                    <td className="small text-muted">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2">
                        {u.accountStatus === 'Pending Approval' && (
                          <button
                            type="button"
                            className="btn btn-sm btn-success d-flex align-items-center gap-1"
                            onClick={() => handleApproveRegistration(u)}
                            title="Approve registration"
                          >
                            <CheckCircle size={14} /> Approve
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleOpenEdit(u)}
                          title="Edit user details"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${
                            u.accountStatus === 'Active' ? 'btn-outline-danger' : 'btn-outline-success'
                          }`}
                          onClick={() => setUserToToggle(u)}
                          title={u.accountStatus === 'Active' ? 'Deactivate account' : 'Activate account'}
                        >
                          {u.accountStatus === 'Active' ? <XCircle size={14} /> : <CheckCircle size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit User Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingUser ? `Edit User: ${editingUser.name}` : 'Create New User Account'}
        size="md"
      >
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-danger py-2 small">{error}</div>}

          <FormField label="Full Name" required>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </FormField>

          <FormField label="Email Address" required>
            <input
              type="email"
              className="form-control"
              value={formData.email}
              disabled={!!editingUser}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </FormField>

          <FormField label="Phone Number">
            <input
              type="text"
              className="form-control"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </FormField>

          <FormField label="Department" required>
            <select
              className="form-select"
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              required
            >
              {departments.map((d) => (
                <option key={d._id || d.departmentId} value={d._id || d.departmentId}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </FormField>

          <div className="mb-3">
            <label className="form-label small fw-semibold text-muted">Assigned System Roles</label>
            <div className="d-flex flex-wrap gap-2">
              {['student', 'guide', 'hod', 'panel', 'admin'].map((role) => {
                const isSelected = formData.roles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    className={`btn btn-sm ${
                      isSelected ? 'btn-primary' : 'btn-outline-secondary'
                    } text-uppercase`}
                    onClick={() => {
                      if (isSelected) {
                        if (formData.roles.length > 1) {
                          setFormData({ ...formData, roles: formData.roles.filter((r) => r !== role) });
                        }
                      } else {
                        setFormData({ ...formData, roles: [...formData.roles, role] });
                      }
                    }}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </div>

          {!editingUser && (
            <FormField label="Temporary Password" required>
              <input
                type="text"
                className="form-control"
                value={formData.temporaryPassword}
                onChange={(e) => setFormData({ ...formData, temporaryPassword: e.target.value })}
                required
              />
              <span className="text-muted small">User will be forced to change this on their first login.</span>
            </FormField>
          )}

          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Deactivate Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!userToToggle}
        title={userToToggle?.accountStatus === 'Active' ? 'Deactivate User Account?' : 'Activate User Account?'}
        message={`Are you sure you want to change the status of ${userToToggle?.name}? Deactivated users cannot log into the platform.`}
        confirmText={userToToggle?.accountStatus === 'Active' ? 'Deactivate' : 'Activate'}
        variant={userToToggle?.accountStatus === 'Active' ? 'danger' : 'success'}
        onConfirm={handleToggleStatus}
        onCancel={() => setUserToToggle(null)}
      />
    </div>
  );
};

export default UserManagement;
