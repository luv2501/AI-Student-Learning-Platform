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
  return config;
});

/** Pulls a readable message out of an axios error. */
export function apiErrorMessage(err) {
  return err?.response?.data?.message || err?.message || 'Something went wrong';
}

export default api;
