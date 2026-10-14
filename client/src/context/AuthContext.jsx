import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { TOKEN_KEY } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // On first load, restore the session from the stored token.
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setLoading(false);
      return;
    }

    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  // Listen for unauthorized 401 events from axios interceptor
  useEffect(() => {
    function handleUnauthorized(e) {
      setUser(null);
      const message = e?.detail?.message || 'Your session expired, please log in again';
      navigate('/login?expired=true', {
        replace: true,
        state: { expired: true, message },
      });
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [navigate]);

  function saveSession(data) {
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
  }

  async function register(payload) {
    const { data } = await api.post('/auth/register', payload);
    saveSession(data);
  }

  async function login(payload) {
    const { data } = await api.post('/auth/login', payload);
    saveSession(data);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }

  async function updateProfile(payload) {
    const { data } = await api.put('/auth/me', payload);
    setUser(data.user);
    return data.user;
  }

  const value = { user, loading, register, login, logout, updateProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
