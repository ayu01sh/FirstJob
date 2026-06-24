import { api } from "../../shared/api/client";

export type VerificationStatus = "unverified" | "verified" | "rejected";
export type JobPreference = "internship" | "full_time" | "remote";

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  target_role: string;
  skills?: string[];
  college_name?: string;
  college_email?: string;
  college_domain?: string;
  degree?: string;
  branch?: string;
  graduation_year?: number;
  cgpa?: number;
  backlogs?: number;
  preferred_locations?: string[];
  job_preferences?: JobPreference[];
  verification_status?: VerificationStatus;
  linkedin?: string;
  github?: string;
  projects_url?: string;
};

export type College = {
  id: string;
  college_name: string;
  allowed_domains: string[];
};

export type ReadinessSection = {
  label: string;
  complete: boolean;
};

export type ReadinessData = {
  score: number;
  completed: string[];
  missing: string[];
  sections: ReadinessSection[];
  next_action: string;
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
  name: string;
  target_role: string;
  degree?: string;
  branch?: string;
  graduation_year?: number;
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

export async function updateProfile(payload: {
  name?: string;
  target_role: string;
  skills: string[];
  college_name?: string;
  degree?: string;
  branch?: string;
  graduation_year?: number;
  cgpa?: number | null;
  backlogs?: number | null;
  preferred_locations?: string[];
  job_preferences?: JobPreference[];
  linkedin?: string;
  github?: string;
  projects_url?: string;
}) {
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

export async function fetchColleges() {
  const res = await api.get("/api/v1/colleges");
  return res.data.data.items as College[];
}

export async function fetchReadiness() {
  const res = await api.get("/api/v1/student/readiness");
  return res.data.data as ReadinessData;
}
