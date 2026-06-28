import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register, storeSession, fetchColleges, type College } from "./auth";
import { Input, Select, Button } from "../../components/ui";

const DEGREE_OPTIONS = ["", "B.Tech", "B.E.", "BCA", "MCA", "M.Tech", "MBA", "B.Sc", "M.Sc"];
const BRANCH_OPTIONS = ["", "CSE", "IT", "ECE", "EEE", "ME", "CE", "Other"];

function graduationYearOptions(): number[] {
  const years: number[] = [];
  for (let y = 2024; y <= 2029; y++) {
    years.push(y);
  }
  return years;
}

export default function RegisterPage() {
  const navigate = useNavigate();
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

  useEffect(() => {
    fetchColleges()
      .then(setColleges)
      .catch(() => {});
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
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.error?.details?.[0] || "Unable to create your account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container auth" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 0" }}>
      <div className="card shell-card auth-card" style={{ width: "100%", maxWidth: "1000px" }}>
        <section className="auth-brand-panel" style={{ padding: "3rem 4rem" }}>
          <div className="auth-brand-mark">
            <img src="/firstjob-mark.svg" alt="FirstJob" className="brand-mark" />
            <div className="auth-brand-copy">
              <h1 className="auth-brand-title">FirstJob</h1>
            </div>
          </div>
          <div className="stack-md">
            <h2 className="auth-headline">Build a student profile that feels placement-ready.</h2>
            <p className="muted auth-copy">
              Create your student account with a verified college email, set your academic details, and start shaping a
              placement profile that connects resume feedback, job discovery, and interview preparation.
            </p>
          </div>
          <div className="auth-stat-strip">
            <div className="auth-stat">
              <span className="auth-stat-value">01</span>
              <span className="auth-stat-label">Verify college email</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat-value">02</span>
              <span className="auth-stat-label">Set academic details</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat-value">03</span>
              <span className="auth-stat-label">Upload resume & explore</span>
            </div>
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="auth-shell">
            <p className="eyebrow">Student Onboarding</p>
            <h2>Create Student Account</h2>
            <p className="muted">Use your college email to verify your student identity automatically.</p>
          </div>
          <form onSubmit={onSubmit} className="stack-sm">
            <div className="field">
              <span className="field-label">Full Name</span>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ayush Srivastava"
                required
              />
            </div>
            <div className="field">
              <span className="field-label">College Email</span>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.ac.in"
                required
              />
            </div>
            {email.includes("@") && (
              <div className={`college-detect ${detectedCollege ? "college-detect-ok" : "college-detect-warn"}`}>
                {detectedCollege
                  ? `✓ ${detectedCollege.college_name}`
                  : "⚠ This domain is not from a recognized college"}
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
                <Input
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="Frontend Developer"
                  required
                />
              </div>
            </div>
            <div className="field">
              <span className="field-label">Password</span>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
              />
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

            <Button variant="primary" style={{ width: "100%", marginTop: "1rem" }} disabled={submitting}>
              {submitting ? "Creating account..." : "Join FirstJob"}
            </Button>
          </form>
          {error && <p className="error">{error}</p>}
          <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
            <p className="muted text-sm">
              Already have an account? <Link to="/login">Log In</Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
