import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bookleaf_user') || 'null'); }
    catch { return null; }
  });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('bookleaf_token')));

  useEffect(() => {
    let active = true;
    if (!localStorage.getItem('bookleaf_token')) { setLoading(false); return undefined; }
    api.get('/auth/me')
      .then(({ data }) => { if (active) { setUser(data.user); localStorage.setItem('bookleaf_user', JSON.stringify(data.user)); } })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    async login(email, password) {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('bookleaf_token', data.token);
      localStorage.setItem('bookleaf_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    },
    logout() {
      localStorage.removeItem('bookleaf_token');
      localStorage.removeItem('bookleaf_user');
      setUser(null);
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
