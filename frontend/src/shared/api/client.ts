import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const AUTH_EVENT = "firstjob-auth-changed";
const AUTH_REQUIRED_EVENT = "firstjob-auth-required";

export const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("firstjob_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("firstjob_token");
      localStorage.removeItem("firstjob_user");
      window.dispatchEvent(new Event(AUTH_EVENT));
      // Instead of hard redirect to /login, trigger auth modal
      window.dispatchEvent(new Event(AUTH_REQUIRED_EVENT));
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

