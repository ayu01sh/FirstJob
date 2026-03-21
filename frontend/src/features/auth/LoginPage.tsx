import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "./auth";

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
      localStorage.setItem("firstjob_token", data.access_token);
      localStorage.setItem("firstjob_user", JSON.stringify(data.user));
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.error?.details?.[0] || "Login failed");
    }
  };

  return (
    <div className="container auth">
      <h2>Login</h2>
      <form onSubmit={onSubmit} className="form">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <button type="submit">Login</button>
      </form>
      {error && <p className="error">{error}</p>}
      <p>
        New user? <Link to="/register">Create account</Link>
      </p>
    </div>
  );
}
