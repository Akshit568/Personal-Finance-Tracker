import axios from 'axios';

const TOKEN_KEY = 'ft-token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// Base URL: "/api" in dev (proxied by Vite) or a full URL from VITE_API_URL.
const baseURL = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

// Attach the JWT to every request.
client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Registered by AuthContext so a 401 can force a logout+redirect.
let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

client.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    // Auto-logout on 401 — but not for the login/register calls themselves,
    // where a 401 simply means bad credentials.
    if (status === 401 && !url.includes('/auth/login') && !url.includes('/auth/register')) {
      if (onUnauthorized) onUnauthorized();
    }
    // Normalize the error message coming from the API envelope.
    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.[0]?.message ||
      error.message ||
      'Something went wrong';
    return Promise.reject(Object.assign(error, { apiMessage: message }));
  }
);

export default client;
