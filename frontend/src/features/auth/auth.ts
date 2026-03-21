import { api } from "../../shared/api/client";

export type AuthUser = {
  id: string;
  email: string;
  target_role: string;
  skills?: string[];
};

export async function register(payload: {
  email: string;
  password: string;
  target_role: string;
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
