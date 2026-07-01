import { FormEvent, useEffect, useState } from "react";
import { PageHeader, EmptyState, BaseCard, CardContent, Input, Select, TextArea, Button, Badge } from "../../components/ui";
import { ChevronDown, ChevronRight, User, GraduationCap, Briefcase, Code } from "lucide-react";
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

const CollapsibleSection = ({ 
  title, 
  icon, 
  children, 
  defaultOpen = true 
}: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode; 
  defaultOpen?: boolean 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <BaseCard>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          padding: "1.25rem", 
          cursor: "pointer", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          borderBottom: isOpen ? "1px solid var(--border)" : "none"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ color: "var(--primary)" }}>{icon}</div>
          <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{title}</h3>
        </div>
        <div style={{ color: "var(--muted)" }}>
          {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
      </div>
      {isOpen && (
        <CardContent style={{ padding: "1.25rem" }}>
          {children}
        </CardContent>
      )}
    </BaseCard>
  );
};

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
  const [avatar, setAvatar] = useState("");
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
    setAvatar(user.avatar || "");
    setVerificationStatus(user.verification_status || "unverified");
  }

  const toggleJobPref = (pref: JobPreference) => {
    setJobPrefs((prev) => (prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
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
        avatar: avatar || undefined,
      });
      setSuccess("Your profile has been updated.");
      populateFields(updated);

      try {
        const data = await fetchReadiness();
        setReadiness(data);
      } catch {
        /* best-effort */
      }
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);
      
    } catch (err: any) {
      setError(err?.response?.data?.error?.details?.[0] || "Could not update your profile.");
    } finally {
      setSaving(false);
    }
  };

  const badgeVariant =
    verificationStatus === "verified"
      ? "success"
      : verificationStatus === "rejected"
      ? "danger"
      : "warning";

  return (
    <div className="stack-lg">
      <PageHeader
        eyebrow="Profile"
        title="Manage Your Profile"
        description="Keep your academic details, skills, and preferences up to date so recommendations and eligibility checks stay accurate."
      />



      {loading ? (
        <EmptyState title="Loading your profile..." />
      ) : (
        <form className="form stack-lg" onSubmit={onSubmit} style={{ paddingBottom: "100px" }}>
          
          <CollapsibleSection title="Personal Information" icon={<User size={24} />} defaultOpen={true}>
            <div className="stack-lg">
              <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                {avatar ? (
                  <img src={avatar} alt="Profile" style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--primary-light)" }} />
                ) : (
                  <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "var(--surface-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", border: "2px dashed var(--border)" }}>
                    <User size={32} />
                  </div>
                )}
                <div className="stack-sm" style={{ flex: 1 }}>
                  <label className="button button-secondary" style={{ width: "fit-content" }}>
                    Upload Picture
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
                  </label>
                  {avatar && (
                    <Button variant="ghost" size="sm" onClick={() => setAvatar("")} type="button" style={{ color: "var(--danger)" }}>
                      Remove Picture
                    </Button>
                  )}
                </div>
              </div>

              <div className="field-row">
                <label className="field" style={{ flex: 1 }}>
                  <span className="field-label">Name</span>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ayush Srivastava" />
                </label>
                <label className="field" style={{ flex: 1 }}>
                  <span className="field-label">Email</span>
                  <Input value={email} readOnly disabled style={{ backgroundColor: "var(--surface-soft)" }} />
                </label>
              </div>

              <div className="field-row">
                <label className="field" style={{ flex: 1 }}>
                  <span className="field-label">LinkedIn</span>
                  <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." />
                </label>
                <label className="field" style={{ flex: 1 }}>
                  <span className="field-label">GitHub</span>
                  <Input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/..." />
                </label>
              </div>

              <label className="field">
                <span className="field-label">Portfolio / Projects URL</span>
                <Input value={projectsUrl} onChange={(e) => setProjectsUrl(e.target.value)} placeholder="https://..." />
              </label>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Academic Details" icon={<GraduationCap size={24} />} defaultOpen={true}>
            <div className="stack-lg">
              <label className="field">
                <span className="field-label">College</span>
                <Input
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  readOnly={!!(collegeName && verificationStatus === "verified")}
                  disabled={!!(collegeName && verificationStatus === "verified")}
                  placeholder="Your college name"
                />
              </label>
              <div className="field-row">
                <label className="field" style={{ flex: 1 }}>
                  <span className="field-label">Degree</span>
                  <Select value={degree} onChange={(e) => setDegree(e.target.value)}>
                    <option value="">Select degree</option>
                    {DEGREE_OPTIONS.filter(Boolean).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </Select>
                </label>
                <label className="field" style={{ flex: 1 }}>
                  <span className="field-label">Branch</span>
                  <Select value={branch} onChange={(e) => setBranch(e.target.value)}>
                    <option value="">Select branch</option>
                    {BRANCH_OPTIONS.filter(Boolean).map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </Select>
                </label>
              </div>
              <div className="field-row">
                <label className="field" style={{ flex: 1 }}>
                  <span className="field-label">Graduation Year</span>
                  <Select value={gradYear} onChange={(e) => setGradYear(e.target.value ? Number(e.target.value) : "")}>
                    <option value="">Select year</option>
                    {graduationYearOptions().map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </Select>
                </label>
                <label className="field" style={{ flex: 1 }}>
                  <span className="field-label">CGPA</span>
                  <Input type="number" step="0.01" min="0" max="10" value={cgpa} onChange={(e) => setCgpa(e.target.value)} placeholder="8.5" />
                </label>
                <label className="field" style={{ flex: 1 }}>
                  <span className="field-label">Active Backlogs</span>
                  <Input type="number" min="0" value={backlogs} onChange={(e) => setBacklogs(e.target.value)} placeholder="0" />
                </label>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Career Preferences" icon={<Briefcase size={24} />} defaultOpen={true}>
            <div className="stack-lg">
              <label className="field">
                <span className="field-label">Target Role</span>
                <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="Frontend Developer" />
              </label>
              <div className="field">
                <span className="field-label">Job Type Preferences</span>
                <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                  {JOB_PREF_OPTIONS.map((opt) => (
                    <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={jobPrefs.includes(opt.value)}
                        onChange={() => toggleJobPref(opt.value)}
                        style={{ width: "1.2rem", height: "1.2rem", accentColor: "var(--primary)" }}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <label className="field">
                <span className="field-label">Preferred Locations</span>
                <Input
                  value={locationsText}
                  onChange={(e) => setLocationsText(e.target.value)}
                  placeholder="Bengaluru, Hyderabad, Remote"
                />
                <span className="text-sm muted" style={{ marginTop: "0.25rem" }}>Comma-separated list of cities or Remote.</span>
              </label>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Technical Skills" icon={<Code size={24} />} defaultOpen={true}>
            <div className="stack-lg">
              <label className="field">
                <span className="field-label">Core Skills</span>
                <TextArea
                  rows={4}
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  placeholder="React, TypeScript, Python, FastAPI, SQL"
                />
                <span className="text-sm muted" style={{ marginTop: "0.25rem" }}>Add comma-separated skills. These power your recommendations and eligibility checks.</span>
              </label>
            </div>
          </CollapsibleSection>

          {/* Sticky Save Bar */}
          <div style={{ 
            position: "fixed", 
            bottom: 0, 
            left: 0,
            right: 0,
            padding: "1rem 2rem", 
            backgroundColor: "var(--surface)", 
            borderTop: "1px solid var(--border)", 
            boxShadow: "0 -4px 12px rgba(0,0,0,0.05)",
            zIndex: 10, 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center" 
          }}>
            <div style={{ maxWidth: "60%" }}>
              {error && <p className="error" style={{ margin: 0 }}>{error}</p>}
              {success && <p className="success-text" style={{ margin: 0, color: "var(--success)" }}>{success}</p>}
            </div>
            <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
              <Button variant="primary" size="lg" disabled={saving} type="submit" style={{ minWidth: "150px" }}>
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
