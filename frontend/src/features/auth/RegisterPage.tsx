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
      <div className="card shell-card">
        <div className="auth-shell">
          <p className="eyebrow">Onboarding</p>
          <h2>Create Account</h2>
          <p className="muted">Set your target role now. You can refine it again when uploading your resume.</p>
        </div>
        <form onSubmit={onSubmit} className="form">
          <label className="field">
            <span className="field-label">Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          </label>
          <label className="field">
            <span className="field-label">Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 8)" />
          </label>
          <label className="field">
            <span className="field-label">Target role</span>
            <input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="Target role" />
          </label>
          <button className="button button-primary" type="submit">Create Account</button>
        </form>
        {error && <p className="error">{error}</p>}
        <p className="muted">
          Already have an account? <Link to="/login">Log In</Link>
        </p>
      </div>
    </div>
  );
}
