import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FormField from '../../components/common/FormField';
import api from '../../api/client';
import { GraduationCap, UserPlus, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('student');
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState([]);

  // Role-specific fields
  const [regNo, setRegNo] = useState('');
  const [semester, setSemester] = useState(8);
  const [facultyId, setFacultyId] = useState('');
  const [hodId, setHodId] = useState('');

  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/departments').then((res) => {
      setDepartments(res.data || []);
      if (res.data && res.data.length > 0) {
        setDepartmentId(res.data[0]._id);
      }
    }).catch(() => {});
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    const payload = {
      name,
      email,
      password,
      phone,
      role,
      departmentId
    };

    if (role === 'student') {
      payload.regNo = regNo.toUpperCase();
      payload.semester = Number(semester);
    } else if (role === 'guide') {
      payload.facultyId = facultyId.toUpperCase();
    } else if (role === 'hod') {
      payload.hodId = hodId.toUpperCase();
    }

    try {
      const data = await register(payload);
      if (data.user.accountStatus === 'Active') {
        navigate(`/${role}/dashboard`);
      } else {
        setSuccessMessage(
          'Your faculty registration has been submitted and is currently pending administrator approval. You will be able to log in once approved.'
        );
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center p-3" style={{ backgroundColor: 'var(--color-page-bg)' }}>
      <div className="card shadow-sm border p-4 p-md-5 w-100 my-4" style={{ maxWidth: '520px', borderRadius: '12px' }}>
        <div className="text-center mb-4">
          <div
            className="d-inline-flex p-3 rounded-circle mb-2"
            style={{ backgroundColor: 'var(--color-light-blue)', color: 'var(--color-navy)' }}
          >
            <GraduationCap size={32} />
          </div>
          <h3 className="fw-bold mb-1" style={{ color: 'var(--color-navy)' }}>Create an Account</h3>
          <div className="text-muted small">ProjAxis Academic Project Management System</div>
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage ? (
          <div className="text-center py-4">
            <CheckCircle2 size={48} className="text-success mb-3" />
            <h5 className="fw-bold mb-2">Registration Submitted!</h5>
            <p className="text-muted small mb-4">{successMessage}</p>
            <Link to="/login" className="btn btn-primary">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="row g-2">
              <div className="col-12">
                <FormField label="Full Name" id="name" required>
                  <input
                    type="text"
                    id="name"
                    className="form-control"
                    placeholder="e.g. Alice Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </FormField>
              </div>

              <div className="col-12 col-md-6">
                <FormField label="Email Address" id="email" required>
                  <input
                    type="email"
                    id="email"
                    className="form-control"
                    placeholder="name@projaxis.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </FormField>
              </div>

              <div className="col-12 col-md-6">
                <FormField label="Phone" id="phone">
                  <input
                    type="tel"
                    id="phone"
                    className="form-control"
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </FormField>
              </div>

              <div className="col-12 col-md-6">
                <FormField label="Account Role" id="role" required>
                  <select
                    id="role"
                    className="form-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="student">Student</option>
                    <option value="guide">Project Guide (Faculty)</option>
                    <option value="hod">Head of Department (HOD)</option>
                  </select>
                </FormField>
              </div>

              <div className="col-12 col-md-6">
                <FormField label="Department" id="department" required>
                  <select
                    id="department"
                    className="form-select"
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    required
                  >
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              {/* Role specific profile fields */}
              {role === 'student' && (
                <>
                  <div className="col-12 col-md-6">
                    <FormField label="Register Number" id="regNo" required>
                      <input
                        type="text"
                        id="regNo"
                        className="form-control text-uppercase"
                        placeholder="e.g. 2023CSE001"
                        value={regNo}
                        onChange={(e) => setRegNo(e.target.value)}
                        required
                      />
                    </FormField>
                  </div>
                  <div className="col-12 col-md-6">
                    <FormField label="Current Semester" id="semester" required>
                      <select
                        id="semester"
                        className="form-select"
                        value={semester}
                        onChange={(e) => setSemester(Number(e.target.value))}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>
                            Semester {s}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>
                </>
              )}

              {role === 'guide' && (
                <div className="col-12">
                  <FormField label="Faculty Identification ID" id="facultyId" required>
                    <input
                      type="text"
                      id="facultyId"
                      className="form-control text-uppercase"
                      placeholder="e.g. FAC-CSE-01"
                      value={facultyId}
                      onChange={(e) => setFacultyId(e.target.value)}
                      required
                    />
                  </FormField>
                </div>
              )}

              {role === 'hod' && (
                <div className="col-12">
                  <FormField label="HOD Identification ID" id="hodId" required>
                    <input
                      type="text"
                      id="hodId"
                      className="form-control text-uppercase"
                      placeholder="e.g. HOD-CSE-01"
                      value={hodId}
                      onChange={(e) => setHodId(e.target.value)}
                      required
                    />
                  </FormField>
                </div>
              )}

              {role !== 'student' && (
                <div className="col-12">
                  <div className="alert alert-warning py-2 px-3 small d-flex align-items-center gap-2 mb-2">
                    <Info size={16} className="flex-shrink-0" />
                    <span>Faculty and HOD accounts require administrator approval before login.</span>
                  </div>
                </div>
              )}

              <div className="col-12">
                <FormField label="Password" id="password" required helperText="At least 6 characters">
                  <input
                    type="password"
                    id="password"
                    className="form-control"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </FormField>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2 py-2 mt-2 mb-3"
              disabled={loading}
            >
              {loading ? 'Registering...' : (
                <>
                  <UserPlus size={18} /> Complete Registration
                </>
              )}
            </button>

            <div className="text-center small text-muted">
              Already registered?{' '}
              <Link to="/login" className="fw-semibold">
                Sign in here
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Register;
