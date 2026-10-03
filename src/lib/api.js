import axios from 'axios';
import { useAuthStore } from '@/store/auth';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Single in-flight refresh shared by all requests that hit 401 at the same time.
let refreshPromise = null;

export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${api.defaults.baseURL}/auth/refresh`, null, { withCredentials: true })
      .then(({ data }) => {
        useAuthStore.getState().setSession(data);
        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const code = error.response?.data?.error?.code;
    if (error.response?.status === 401 && code === 'TOKEN_EXPIRED' && !original._retry) {
      original._retry = true;
      try {
        const token = await refreshSession();
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        useAuthStore.getState().clear();
      }
    }
    return Promise.reject(error);
  }
);

/** Human-readable (Bangla) message from an axios error. */
export function errorMessage(err, fallback = 'কিছু একটা ভুল হয়েছে') {
  return err?.response?.data?.error?.message || (err?.message === 'Network Error' ? 'সার্ভারের সাথে সংযোগ হচ্ছে না' : fallback);
}
