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
      <div className="card shell-card auth-card">
        <section className="auth-brand-panel">
          <div className="auth-brand-mark">
            <img src="/firstjob-mark.svg" alt="FirstJob" className="brand-mark" />
            <div className="auth-brand-copy">
              <p className="eyebrow">Career Platform</p>
              <h1 className="auth-brand-title">FirstJob</h1>
            </div>
          </div>
          <div className="stack-md">
            <h2 className="auth-headline">Sharper resumes, cleaner matches, and focused preparation.</h2>
            <p className="muted auth-copy">
              FirstJob helps fresh graduates move from resume cleanup to role discovery and structured interview prep in one calm workflow.
            </p>
          </div>
          <div className="auth-feature-list">
            <div className="auth-feature">
              <span className="auth-feature-tag">ATS</span>
              <p>Deterministic resume feedback with clear next steps.</p>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-tag">Matches</span>
              <p>Role-aware opportunities ranked around your current profile.</p>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-tag">Notes</span>
              <p>Structured study notes that keep interview revision fast and practical.</p>
            </div>
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="auth-shell">
            <p className="eyebrow">Access</p>
            <h2>Log In</h2>
            <p className="muted">Access your workspace to manage your resume, matches, and learning notes.</p>
          </div>
          <form onSubmit={onSubmit} className="form">
            <label className="field">
              <span className="field-label">Email</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" />
            </label>
            <label className="field">
              <span className="field-label">Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
            </label>
            <button className="button button-primary auth-submit" type="submit">Log In</button>
          </form>
          {error && <p className="error">{error}</p>}
          <p className="muted auth-switch">
            New here? <Link to="/register">Create an account</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
