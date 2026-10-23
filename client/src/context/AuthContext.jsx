import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize and check current session
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get('/auth/me');
        if (response.data && response.data.user) {
          const u = response.data.user;
          setUser(u);
          const storedRole = localStorage.getItem('projaxis_active_role');
          const roleToSet = storedRole && u.roles?.includes(storedRole) ? storedRole : u.roles?.[0] || 'student';
          setActiveRole(roleToSet);
        }
      } catch (err) {
        localStorage.removeItem('projaxis_token');
        setUser(null);
        setActiveRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const payload = res.data || res;
    const loggedUser = payload.user || payload;
    const token = payload.token;
    if (token) {
      localStorage.setItem('projaxis_token', token);
    }
    setUser(loggedUser);
    const initialRole = loggedUser.roles?.[0] || 'student';
    setActiveRole(initialRole);
    localStorage.setItem('projaxis_active_role', initialRole);
    return payload;
  };

  const register = async (payload) => {
    const res = await api.post('/auth/register', payload);
    const data = res.data || res;
    const registeredUser = data.user;
    const token = data.token;
    if (token) {
      localStorage.setItem('projaxis_token', token);
    }
    if (registeredUser && registeredUser.accountStatus === 'Active') {
      setUser(registeredUser);
      const initialRole = registeredUser.roles?.[0] || 'student';
      setActiveRole(initialRole);
      localStorage.setItem('projaxis_active_role', initialRole);
    }
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Continue client cleanup even if network fails
    }
    localStorage.removeItem('projaxis_token');
    localStorage.removeItem('projaxis_active_role');
    setUser(null);
    setActiveRole(null);
  };

  const switchRole = (role) => {
    if (user && user.roles?.includes(role)) {
      setActiveRole(role);
      localStorage.setItem('projaxis_active_role', role);
    }
  };

  const updateUserState = (updatedFields) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeRole,
        loading,
        login,
        register,
        logout,
        switchRole,
        updateUserState,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
