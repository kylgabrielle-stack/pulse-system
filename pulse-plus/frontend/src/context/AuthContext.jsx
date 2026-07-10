import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pulse_token');
    const savedUser = localStorage.getItem('pulse_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await api.post('/auth/login', { username, password });
    localStorage.setItem('pulse_token', data.token);
    localStorage.setItem('pulse_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('pulse_token');
    localStorage.removeItem('pulse_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export const ROLE_LABELS = {
  staff: 'Technical Section Staff',
  section_head: 'Technical Section Head',
  population_officer: 'Provincial Population Officer',
  admin: 'Admin',
};
