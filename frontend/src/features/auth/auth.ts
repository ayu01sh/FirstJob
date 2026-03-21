import { api } from "../../shared/api/client";

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  target_role: string;
  skills?: string[];
};

const TOKEN_KEY = "firstjob_token";
const USER_KEY = "firstjob_user";
const AUTH_EVENT = "firstjob-auth-changed";

function emitAuthChanged() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function getAuthEventName() {
  return AUTH_EVENT;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function storeSession(user: AuthUser, accessToken: string) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  emitAuthChanged();
}

export function storeUser(user: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  emitAuthChanged();
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  emitAuthChanged();
}

export async function register(payload: {
  email: string;
  password: string;
  target_role: string;
  name?: string;
}) {
  const res = await api.post("/api/v1/auth/register", payload);
  return res.data.data as { user: AuthUser; access_token: string };
}

export async function login(payload: { email: string; password: string }) {
  const res = await api.post("/api/v1/auth/login", payload);
  return res.data.data as { user: AuthUser; access_token: string };
}

export async function me() {
  const res = await api.get("/api/v1/auth/me");
  return res.data.data as AuthUser;
}

export async function updateProfile(payload: { name?: string; target_role: string; skills: string[] }) {
  const res = await api.put("/api/v1/auth/profile", payload);
  const user = res.data.data as AuthUser;
  storeUser(user);
  return user;
}

export async function syncCurrentUser() {
  const user = await me();
  storeUser(user);
  return user;
}
