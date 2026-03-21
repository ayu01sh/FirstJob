import { FormEvent, useEffect, useState } from "react";
import { getStoredUser, syncCurrentUser, updateProfile } from "./auth";

export default function ProfilePage() {
  const [email, setEmail] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        const user = await syncCurrentUser();
        if (!mounted) {
          return;
        }
        setEmail(user.email);
        setTargetRole(user.target_role || "");
        setSkillsText((user.skills || []).join(", "));
      } catch {
        const stored = getStoredUser();
        if (stored && mounted) {
          setEmail(stored.email);
          setTargetRole(stored.target_role || "");
          setSkillsText((stored.skills || []).join(", "));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const skills = skillsText
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    try {
      await updateProfile({ target_role: targetRole, skills });
      setSuccess("Your profile has been updated.");
      setSkillsText(skills.join(", "));
    } catch (err: any) {
      setError(err?.response?.data?.error?.details?.[0] || "Could not update your profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stack-lg">
      <section className="section-block">
        <p className="eyebrow">Profile</p>
        <h3>Manage Your Career Preferences</h3>
        <p className="muted">
          Keep your target role and core skills up to date so your matches stay relevant, even before a resume upload.
        </p>
      </section>

      {loading ? (
        <div className="empty-state">Loading your profile...</div>
      ) : (
        <div className="profile-layout">
          <section className="panel stack-md">
            <p className="eyebrow">Account</p>
            <div className="stack-sm">
              <p><strong>Email</strong></p>
              <p className="muted">{email}</p>
            </div>
            <div className="stack-sm">
              <p><strong>Member Type</strong></p>
              <p className="muted">Student and early-career candidate</p>
            </div>
          </section>

          <section className="panel stack-md">
            <p className="eyebrow">Preferences</p>
            <form className="form" onSubmit={onSubmit}>
              <label className="field">
                <span className="field-label">Target Role</span>
                <input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="Frontend Developer" />
              </label>
              <label className="field">
                <span className="field-label">Core Skills</span>
                <textarea
                  className="text-area"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  placeholder="React, TypeScript, CSS"
                />
              </label>
              <p className="muted">Add comma-separated skills such as React, Python, FastAPI, SQL, or AWS.</p>
              <button className="button button-primary" disabled={saving} type="submit">
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </form>
            {error && <p className="error">{error}</p>}
            {success && <p className="success-banner">{success}</p>}
          </section>
        </div>
      )}
    </div>
  );
}
