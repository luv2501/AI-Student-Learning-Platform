import axios from 'axios';

export const TOKEN_KEY = 'studymind_token';

/**
 * Single axios instance used by the whole app.
 * The JWT is read from localStorage before every request.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Attach client timezone header for timezone-aware queries
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone) {
      config.headers['X-Timezone'] = timezone;
    }
  } catch {
    /* ignore in environments where Intl is not supported */
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // When a 401 occurs mid-session due to invalid/expired token, cleanly clear session
    if (error?.response?.status === 401) {
      const url = String(error.config?.url || '');
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');

      if (!isAuthEndpoint) {
        localStorage.removeItem(TOKEN_KEY);
        window.dispatchEvent(
          new CustomEvent('auth:unauthorized', {
            detail: { message: 'Your session expired, please log in again' },
          })
        );

        // Fallback redirect if not already on the login page and not handled by router
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          setTimeout(() => {
            if (!window.location.pathname.startsWith('/login')) {
              window.location.href = '/login?expired=true';
            }
          }, 50);
        }
      }
    }
    return Promise.reject(error);
  }
);

/** Pulls a readable message out of an axios error. */
export function apiErrorMessage(err) {
  return err?.response?.data?.message || err?.message || 'Something went wrong';
}

export default api;
