import { FormEvent, useEffect, useState } from "react";
import { getStoredUser, syncCurrentUser, updateProfile } from "./auth";

export default function ProfilePage() {
  const [name, setName] = useState("");
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
        setName(user.name || "");
        setEmail(user.email);
        setTargetRole(user.target_role || "");
        setSkillsText((user.skills || []).join(", "));
      } catch {
        const stored = getStoredUser();
        if (stored && mounted) {
          setName(stored.name || "");
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
      await updateProfile({ name, target_role: targetRole, skills });
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
        <section className="panel profile-editor profile-editor-single">
          <div className="stack-sm">
            <p className="eyebrow">Preferences</p>
            <h4>Refine the details that power your profile.</h4>
            <p className="muted">
              Keep these fields current so FirstJob can personalize resume feedback, matching, and study support more
              accurately.
            </p>
          </div>

          <form className="form" onSubmit={onSubmit}>
            <label className="field">
              <span className="field-label">Email</span>
              <input className="input-readonly" value={email} readOnly aria-readonly="true" />
            </label>
            <p className="muted">This is your account email and cannot be changed from the profile editor.</p>

            <label className="field">
              <span className="field-label">Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ayush Srivastava" />
            </label>
            <p className="muted">Leave this blank if you prefer a simpler workspace greeting in the header.</p>

            <label className="field">
              <span className="field-label">Target Role</span>
              <input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="Frontend Developer" />
            </label>
            <p className="muted">Use the role you are actively applying for so the product can prioritize the right opportunities.</p>

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

            <button className="button button-primary profile-save" disabled={saving} type="submit">
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </form>

          {error && <p className="error">{error}</p>}
          {success && <p className="success-banner">{success}</p>}
        </section>
      )}
    </div>
  );
}
