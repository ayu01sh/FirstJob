import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "./auth";

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
      localStorage.setItem("firstjob_token", data.access_token);
      localStorage.setItem("firstjob_user", JSON.stringify(data.user));
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.error?.details?.[0] || "Register failed");
    }
  };

  return (
    <div className="container auth">
      <h2>Register</h2>
      <form onSubmit={onSubmit} className="form">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 8)" />
        <input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="Target role" />
        <button type="submit">Create account</button>
      </form>
      {error && <p className="error">{error}</p>}
      <p>
        Already have account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}
