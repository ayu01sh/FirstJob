import { FormEvent, useEffect, useState } from "react";
import {
  getStoredUser,
  syncCurrentUser,
  updateProfile,
  fetchReadiness,
  type AuthUser,
  type JobPreference,
  type ReadinessData,
} from "./auth";

const DEGREE_OPTIONS = ["", "B.Tech", "B.E.", "BCA", "MCA", "M.Tech", "MBA", "B.Sc", "M.Sc"];
const BRANCH_OPTIONS = ["", "CSE", "IT", "ECE", "EEE", "ME", "CE", "Other"];
const JOB_PREF_OPTIONS: { value: JobPreference; label: string }[] = [
  { value: "internship", label: "Internship" },
  { value: "full_time", label: "Full-time" },
  { value: "remote", label: "Remote" },
];

function graduationYearOptions(): number[] {
  const years: number[] = [];
  for (let y = 2024; y <= 2029; y++) {
    years.push(y);
  }
  return years;
}

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [degree, setDegree] = useState("");
  const [branch, setBranch] = useState("");
  const [gradYear, setGradYear] = useState<number | "">("");
  const [cgpa, setCgpa] = useState("");
  const [backlogs, setBacklogs] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [jobPrefs, setJobPrefs] = useState<JobPreference[]>([]);
  const [locationsText, setLocationsText] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [projectsUrl, setProjectsUrl] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("unverified");
  const [readiness, setReadiness] = useState<ReadinessData | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        const user = await syncCurrentUser();
        if (!mounted) return;
        populateFields(user);
      } catch {
        const stored = getStoredUser();
        if (stored && mounted) populateFields(stored);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const loadReadiness = async () => {
      try {
        const data = await fetchReadiness();
        if (mounted) setReadiness(data);
      } catch {
        /* readiness is best-effort */
      }
    };

    loadUser();
    loadReadiness();

    return () => {
      mounted = false;
    };
  }, []);

  function populateFields(user: AuthUser) {
    setName(user.name || "");
    setEmail(user.email);
    setCollegeName(user.college_name || "");
    setDegree(user.degree || "");
    setBranch(user.branch || "");
    setGradYear(user.graduation_year || "");
    setCgpa(user.cgpa != null ? String(user.cgpa) : "");
    setBacklogs(user.backlogs != null ? String(user.backlogs) : "");
    setTargetRole(user.target_role || "");
    setSkillsText((user.skills || []).join(", "));
    setJobPrefs(user.job_preferences || []);
    setLocationsText((user.preferred_locations || []).join(", "));
    setLinkedin(user.linkedin || "");
    setGithub(user.github || "");
    setProjectsUrl(user.projects_url || "");
    setVerificationStatus(user.verification_status || "unverified");
  }

  const toggleJobPref = (pref: JobPreference) => {
    setJobPrefs((prev) => (prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const skills = skillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const locations = locationsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const updated = await updateProfile({
        name,
        target_role: targetRole,
        skills,
        college_name: collegeName,
        degree,
        branch,
        graduation_year: gradYear === "" ? undefined : gradYear,
        cgpa: cgpa ? parseFloat(cgpa) : null,
        backlogs: backlogs ? parseInt(backlogs, 10) : null,
        preferred_locations: locations,
        job_preferences: jobPrefs,
        linkedin,
        github,
        projects_url: projectsUrl,
      });
      setSuccess("Your profile has been updated.");
      populateFields(updated);

      try {
        const data = await fetchReadiness();
        setReadiness(data);
      } catch {
        /* best-effort */
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.details?.[0] || "Could not update your profile.");
    } finally {
      setSaving(false);
    }
  };

  const badgeClass =
    verificationStatus === "verified"
      ? "badge-verified"
      : verificationStatus === "rejected"
      ? "badge-rejected"
      : "badge-unverified";

  return (
    <div className="stack-lg">
      <section className="section-block">
        <p className="eyebrow">Student Profile</p>
        <h3>Manage Your Placement Profile</h3>
        <p className="muted">
          Keep your academic details, skills, and preferences up to date so recommendations and eligibility checks stay
          accurate.
        </p>
      </section>

      {readiness && (
        <div className="readiness-strip">
          <div className="readiness-header">
            <span className={`verification-badge ${badgeClass}`}>
              {verificationStatus === "verified" ? "✓ Verified" : verificationStatus === "rejected" ? "✗ Rejected" : "⚠ Unverified"}
            </span>
            <span className="readiness-score">{readiness.score}% Complete</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${readiness.score}%` }} />
          </div>
          {readiness.missing.length > 0 && (
            <div className="readiness-actions">
              {readiness.missing.slice(0, 3).map((action) => (
                <span className="readiness-action-chip" key={action}>{action}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="empty-state">Loading your profile...</div>
      ) : (
        <form className="form stack-lg" onSubmit={onSubmit}>
          {/* Personal */}
          <section className="profile-section">
            <div className="stack-sm">
              <p className="eyebrow">Personal</p>
              <h4>Identity & Links</h4>
            </div>
            <label className="field">
              <span className="field-label">Email</span>
              <input className="input-readonly" value={email} readOnly aria-readonly="true" />
            </label>
            <label className="field">
              <span className="field-label">Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ayush Srivastava" />
            </label>
            <div className="field-row">
              <label className="field">
                <span className="field-label">LinkedIn</span>
                <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." />
              </label>
              <label className="field">
                <span className="field-label">GitHub</span>
                <input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/..." />
              </label>
            </div>
            <label className="field">
              <span className="field-label">Projects / Portfolio URL</span>
              <input value={projectsUrl} onChange={(e) => setProjectsUrl(e.target.value)} placeholder="https://..." />
            </label>
          </section>

          {/* Academic */}
          <section className="profile-section">
            <div className="stack-sm">
              <p className="eyebrow">Academic</p>
              <h4>College & Education</h4>
            </div>
            <label className="field">
              <span className="field-label">College</span>
              <input
                className={collegeName && verificationStatus === "verified" ? "input-readonly" : ""}
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                readOnly={!!(collegeName && verificationStatus === "verified")}
                placeholder="Your college name"
              />
            </label>
            <div className="field-row">
              <label className="field">
                <span className="field-label">Degree</span>
                <select value={degree} onChange={(e) => setDegree(e.target.value)}>
                  <option value="">Select degree</option>
                  {DEGREE_OPTIONS.filter(Boolean).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="field-label">Branch</span>
                <select value={branch} onChange={(e) => setBranch(e.target.value)}>
                  <option value="">Select branch</option>
                  {BRANCH_OPTIONS.filter(Boolean).map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="field-row">
              <label className="field">
                <span className="field-label">Graduation Year</span>
                <select value={gradYear} onChange={(e) => setGradYear(e.target.value ? Number(e.target.value) : "")}>
                  <option value="">Select year</option>
                  {graduationYearOptions().map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="field-label">CGPA</span>
                <input type="number" step="0.01" min="0" max="10" value={cgpa} onChange={(e) => setCgpa(e.target.value)} placeholder="8.5" />
              </label>
              <label className="field">
                <span className="field-label">Backlogs</span>
                <input type="number" min="0" value={backlogs} onChange={(e) => setBacklogs(e.target.value)} placeholder="0" />
              </label>
            </div>
          </section>

          {/* Career Preferences */}
          <section className="profile-section">
            <div className="stack-sm">
              <p className="eyebrow">Career Preferences</p>
              <h4>Role & Location</h4>
            </div>
            <label className="field">
              <span className="field-label">Target Role</span>
              <input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="Frontend Developer" />
            </label>
            <div className="field">
              <span className="field-label">Job Preferences</span>
              <div className="checkbox-row">
                {JOB_PREF_OPTIONS.map((opt) => (
                  <label className="checkbox-label" key={opt.value}>
                    <input
                      type="checkbox"
                      checked={jobPrefs.includes(opt.value)}
                      onChange={() => toggleJobPref(opt.value)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <label className="field">
              <span className="field-label">Preferred Locations</span>
              <input
                value={locationsText}
                onChange={(e) => setLocationsText(e.target.value)}
                placeholder="Bengaluru, Hyderabad, Remote"
              />
            </label>
            <p className="muted">Comma-separated list of cities or Remote.</p>
          </section>

          {/* Skills */}
          <section className="profile-section">
            <div className="stack-sm">
              <p className="eyebrow">Skills</p>
              <h4>Technical Skills</h4>
            </div>
            <label className="field">
              <span className="field-label">Core Skills</span>
              <textarea
                className="text-area"
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                placeholder="React, TypeScript, Python, FastAPI, SQL"
              />
            </label>
            <p className="muted">Add comma-separated skills. These power your recommendations and eligibility checks.</p>
          </section>

          <button className="button button-primary profile-save" disabled={saving} type="submit">
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      )}

      {error && <p className="error">{error}</p>}
      {success && <p className="success-banner">{success}</p>}
    </div>
  );
}
