import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, storeSession } from "./auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const data = await login({ email, password });
      storeSession(data.user, data.access_token);
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.error?.details?.[0] || "Unable to log in.");
    }
  };

  return (
    <div className="container auth">
      <div className="card shell-card">
        <div className="auth-shell">
          <p className="eyebrow">Access</p>
          <h2>Log In</h2>
          <p className="muted">Access your workspace to manage your resume, job matches, and learning notes.</p>
        </div>
        <form onSubmit={onSubmit} className="form">
          <label className="field">
            <span className="field-label">Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          </label>
          <label className="field">
            <span className="field-label">Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          </label>
          <button className="button button-primary" type="submit">Log In</button>
        </form>
        {error && <p className="error">{error}</p>}
        <p className="muted">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
