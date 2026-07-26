import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('vault_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('vault_token') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await API.get('/auth/me');
        if (res.success && res.user) {
          setUser(res.user);
          localStorage.setItem('vault_user', JSON.stringify(res.user));
        }
      } catch (err) {
        console.error('Failed to verify user session:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('vault_token', res.token);
      localStorage.setItem('vault_user', JSON.stringify(res.user));
      return res.user;
    }
  };

  const register = async (name, email, password) => {
    const res = await API.post('/auth/register', { name, email, password });
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('vault_token', res.token);
      localStorage.setItem('vault_user', JSON.stringify(res.user));
      return res.user;
    }
  };

  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('vault_token');
    localStorage.removeItem('vault_user');
  };

  const updateProfile = async (profileData) => {
    const res = await API.put('/auth/profile', profileData);
    if (res.success && res.user) {
      setUser(res.user);
      localStorage.setItem('vault_user', JSON.stringify(res.user));
    }
    return res;
  };

  const updatePassword = async (currentPassword, newPassword) => {
    return await API.put('/auth/update-password', { currentPassword, newPassword });
  };

  const forgotPassword = async (email) => {
    return await API.post('/auth/forgot-password', { email });
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      updateProfile,
      updatePassword,
      forgotPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
