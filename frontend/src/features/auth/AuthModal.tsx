import { FormEvent, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { login, register, storeSession, fetchColleges, type College } from "./auth";
import { useAuth } from "./AuthContext";
import { Input, Select, Button } from "../../components/ui";

const DEGREE_OPTIONS = ["", "B.Tech", "B.E.", "BCA", "MCA", "M.Tech", "MBA", "B.Sc", "M.Sc"];
const BRANCH_OPTIONS = ["", "CSE", "IT", "ECE", "EEE", "ME", "CE", "Other"];

function graduationYearOptions(): number[] {
  const years: number[] = [];
  for (let y = 2024; y <= 2029; y++) years.push(y);
  return years;
}

/* ── Login Tab ── */
function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { onAuthSuccess, setAuthModalTab } = useAuth();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await login({ email, password });
      storeSession(data.user, data.access_token);
      onAuthSuccess(data.user);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.error?.details?.[0] || "Unable to log in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="stack-md">
      <div className="field">
        <span className="field-label">Email</span>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required />
      </div>
      <div className="field">
        <span className="field-label">Password</span>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
      </div>
      <Button variant="primary" style={{ width: "100%", marginTop: "0.5rem" }} type="submit" disabled={submitting}>
        {submitting ? "Signing in..." : "Sign In"}
      </Button>
      {error && <p className="error">{error}</p>}
      <p className="muted text-sm" style={{ textAlign: "center", marginTop: "0.5rem" }}>
        Don't have an account?{" "}
        <button type="button" className="auth-modal-link" onClick={() => setAuthModalTab("register")}>
          Create one
        </button>
      </p>
    </form>
  );
}

/* ── Register Tab ── */
function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [colleges, setColleges] = useState<College[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [degree, setDegree] = useState("");
  const [branch, setBranch] = useState("");
  const [gradYear, setGradYear] = useState<number | "">("");
  const [targetRole, setTargetRole] = useState("Frontend Developer");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { onAuthSuccess, setAuthModalTab } = useAuth();

  useEffect(() => {
    fetchColleges().then(setColleges).catch(() => {});
  }, []);

  const detectedCollege = (() => {
    if (!email.includes("@")) return null;
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) return null;
    return colleges.find((c) => c.allowed_domains.includes(domain)) || null;
  })();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await register({
        email,
        password,
        name,
        target_role: targetRole,
        degree,
        branch,
        graduation_year: gradYear === "" ? undefined : gradYear,
        role,
      });
      storeSession(data.user, data.access_token);
      onAuthSuccess(data.user);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.error?.details?.[0] || "Unable to create your account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="stack-sm">
      <div className="field">
        <span className="field-label">Full Name</span>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ayush Srivastava" required />
      </div>
      <div className="field">
        <span className="field-label">College Email</span>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.ac.in" required />
      </div>
      {email.includes("@") && (
        <div className={`college-detect ${detectedCollege ? "college-detect-ok" : "college-detect-warn"}`}>
          {detectedCollege ? `✓ ${detectedCollege.college_name}` : "⚠ This domain is not from a recognized college"}
        </div>
      )}
      <div className="field-row">
        <div className="field">
          <span className="field-label">Degree</span>
          <Select value={degree} onChange={(e) => setDegree(e.target.value)}>
            <option value="">Select degree</option>
            {DEGREE_OPTIONS.filter(Boolean).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>
        </div>
        <div className="field">
          <span className="field-label">Branch</span>
          <Select value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="">Select branch</option>
            {BRANCH_OPTIONS.filter(Boolean).map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </Select>
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">Graduation Year</span>
          <Select value={gradYear} onChange={(e) => setGradYear(e.target.value ? Number(e.target.value) : "")}>
            <option value="">Select year</option>
            {graduationYearOptions().map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
        </div>
        <div className="field">
          <span className="field-label">Target Role</span>
          <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="Frontend Developer" required />
        </div>
      </div>
      <div className="field">
        <span className="field-label">Password</span>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 8 characters" required />
      </div>
      <div className="field-row">
        <div className="field">
          <span className="field-label">System Role (Dev Only)</span>
          <Select value={role} onChange={(e) => setRole(e.target.value)} required>
            <option value="student">Student</option>
            <option value="recruiter">Recruiter</option>
            <option value="campus_admin">Campus Admin</option>
          </Select>
        </div>
      </div>
      <Button variant="primary" style={{ width: "100%", marginTop: "0.5rem" }} disabled={submitting}>
        {submitting ? "Creating account..." : "Join FirstJob"}
      </Button>
      {error && <p className="error">{error}</p>}
      <p className="muted text-sm" style={{ textAlign: "center", marginTop: "0.5rem" }}>
        Already have an account?{" "}
        <button type="button" className="auth-modal-link" onClick={() => setAuthModalTab("login")}>
          Sign in
        </button>
      </p>
    </form>
  );
}

/* ── Auth Modal ── */
export default function AuthModal() {
  const { authModalOpen, closeAuthModal, authModalTab, setAuthModalTab, pendingRedirect } = useAuth();

  useEffect(() => {
    if (authModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [authModalOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAuthModal();
    };
    if (authModalOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [authModalOpen, closeAuthModal]);

  if (!authModalOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) closeAuthModal();
  };

  const handleSuccess = () => {
    // Navigation to pendingRedirect is handled by AppLayout after auth state changes
  };

  const modalContent = (
    <div className="auth-modal-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className="auth-modal-card">
        {/* Close button */}
        <button className="auth-modal-close" onClick={closeAuthModal} aria-label="Close">
          <X size={20} />
        </button>

        {/* Brand header */}
        <div className="auth-modal-header">
          <img src="/firstjob-mark.svg" alt="FirstJob" className="auth-modal-logo" />
          <span className="auth-modal-brand">FirstJob</span>
        </div>

        {/* Tab switcher */}
        <div className="auth-modal-tabs">
          <button
            className={`auth-modal-tab ${authModalTab === "login" ? "auth-modal-tab-active" : ""}`}
            onClick={() => setAuthModalTab("login")}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`auth-modal-tab ${authModalTab === "register" ? "auth-modal-tab-active" : ""}`}
            onClick={() => setAuthModalTab("register")}
            type="button"
          >
            Create Account
          </button>
        </div>

        {/* Form area */}
        <div className="auth-modal-body">
          {pendingRedirect && pendingRedirect !== "/" && (
            <div className="auth-modal-notice">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10" cy="10" r="8" />
                <line x1="10" y1="6" x2="10" y2="10" />
                <line x1="10" y1="14" x2="10.01" y2="14" />
              </svg>
              <span>Sign in to access this feature</span>
            </div>
          )}
          {authModalTab === "login" ? (
            <LoginForm onSuccess={handleSuccess} />
          ) : (
            <RegisterForm onSuccess={handleSuccess} />
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
