import { FormEvent, useEffect, useState } from "react";
import { api } from "../../shared/api/client";
import { getStoredUser, syncCurrentUser } from "../auth/auth";

type ResumeData = {
  resume_id: string;
  filename: string;
  target_role: string;
  extracted_skills: string[];
  ats_score: number;
  missing_skills: string[];
  suggestions: string[];
  created_at?: string;
};

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<ResumeData | null>(null);
  const [targetRole, setTargetRole] = useState(getStoredUser()?.target_role || "Frontend Developer");

  useEffect(() => {
    let mounted = true;

    const loadLatestResume = async () => {
      try {
        const res = await api.get("/api/v1/resume/latest");
        if (!mounted) {
          return;
        }
        setData(res.data.data);
        setTargetRole(res.data.data.target_role || getStoredUser()?.target_role || "Frontend Developer");
      } catch (err: any) {
        if (!mounted) {
          return;
        }
        const status = err?.response?.status;
        if (status !== 404) {
          setError(err?.response?.data?.error?.details?.[0] || "Could not load your latest resume analysis.");
        }
      } finally {
        if (mounted) {
          setInitialLoading(false);
        }
      }
    };

    loadLatestResume();

    return () => {
      mounted = false;
    };
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    form.append("target_role", targetRole);
    try {
      const res = await api.post("/api/v1/resume/upload", form);
      setData(res.data.data);
      setTargetRole(res.data.data.target_role);
      await syncCurrentUser();
    } catch (err: any) {
      setError(err?.response?.data?.error?.details?.[0] || "Could not upload the resume.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stack-lg">
      <section className="section-block">
        <p className="eyebrow">Resume</p>
        <h3>Upload and Analyze</h3>
        <p className="muted">Set the target role here, upload a resume, and keep the latest analysis visible after reload.</p>
      </section>
      <form onSubmit={onSubmit} className="form">
        <label className="field">
          <span className="field-label">Target role</span>
          <input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="Frontend Developer" />
        </label>
        <label className="field">
          <span className="field-label">Resume file</span>
          <input type="file" accept=".pdf,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
        <button className="button button-primary" disabled={loading || !file} type="submit">
          {loading ? "Analyzing..." : "Upload Resume"}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
      {initialLoading && <div className="empty-state">Loading your latest resume analysis...</div>}
      {!initialLoading && !data && !error && (
        <div className="empty-state">
          <p className="eyebrow">No Analysis Yet</p>
          <p>Upload a known-good PDF or TXT resume to unlock ATS feedback and job matches.</p>
        </div>
      )}
      {data && (
        <div className="result stack-md">
          <div className="row wrap">
            <div>
              <p className="eyebrow">Latest Analysis</p>
              <h4>{data.filename}</h4>
            </div>
            <div className="score-badge">ATS {data.ats_score}</div>
          </div>
          <div className="meta-row">
            <span className="meta-pill">{data.target_role}</span>
            {data.created_at && <span className="muted mono">{new Date(data.created_at).toLocaleString()}</span>}
          </div>
          <div className="stack-sm">
            <p><strong>Extracted skills</strong></p>
            <p className="muted">{data.extracted_skills.join(", ") || "No skills detected"}</p>
          </div>
          <div className="stack-sm">
            <p><strong>Missing skills</strong></p>
            <p className="muted">{data.missing_skills.slice(0, 5).join(", ") || "No obvious gaps found"}</p>
          </div>
          <div className="stack-sm">
            <p><strong>Suggestions</strong></p>
            <ul className="list-clean">
            {data.suggestions.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          </div>
        </div>
      )}
    </div>
  );
}
