import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register, storeSession } from "./auth";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [targetRole, setTargetRole] = useState("Frontend Developer");
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const data = await register({ email, password, target_role: targetRole });
      storeSession(data.user, data.access_token);
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.error?.details?.[0] || "Unable to create your account.");
    }
  };

  return (
    <div className="container auth">
      <div className="card shell-card auth-card">
        <section className="auth-brand-panel">
          <div className="auth-brand-mark">
            <img src="/firstjob-mark.svg" alt="FirstJob" className="brand-mark" />
            <div className="auth-brand-copy">
              <p className="eyebrow">Student Placement Workspace</p>
              <h1 className="auth-brand-title">FirstJob</h1>
            </div>
          </div>
          <div className="stack-md">
            <h2 className="auth-headline">Build a student profile that feels placement-ready.</h2>
            <p className="muted auth-copy">
              Create your account, set a target role, and start shaping a placement profile that connects resume feedback, job discovery, and interview preparation.
            </p>
          </div>
          <div className="auth-stat-strip">
            <div className="auth-stat">
              <span className="auth-stat-value">01</span>
              <span className="auth-stat-label">Set your role</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat-value">02</span>
              <span className="auth-stat-label">Upload your resume</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat-value">03</span>
              <span className="auth-stat-label">Review recommendations</span>
            </div>
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="auth-shell">
            <p className="eyebrow">Student Onboarding</p>
            <h2>Create Student Account</h2>
            <p className="muted">Start with your email, a secure password, and the role you want to prepare for.</p>
          </div>
          <form onSubmit={onSubmit} className="form">
            <label className="field">
              <span className="field-label">Email</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" />
            </label>
            <label className="field">
              <span className="field-label">Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (minimum 8 characters)" />
            </label>
            <label className="field">
              <span className="field-label">Target role</span>
              <input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="Frontend Developer" />
            </label>
            <button className="button button-primary auth-submit" type="submit">Create Account</button>
          </form>
          {error && <p className="error">{error}</p>}
          <p className="muted auth-switch">
            Already have an account? <Link to="/login">Log In</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
