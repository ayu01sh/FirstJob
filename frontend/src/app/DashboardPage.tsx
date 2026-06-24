import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getStoredUser,
  syncCurrentUser,
  fetchReadiness,
  type AuthUser,
  type ReadinessData,
} from "../features/auth/auth";
import { api } from "../shared/api/client";

type ResumeScore = {
  ats_score: number;
  resume_id: string;
};

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [readiness, setReadiness] = useState<ReadinessData | null>(null);
  const [resumeScore, setResumeScore] = useState<ResumeScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const u = await syncCurrentUser();
        if (mounted) setUser(u);
      } catch {
        /* keep stored */
      }

      try {
        const r = await fetchReadiness();
        if (mounted) setReadiness(r);
      } catch {
        /* best-effort */
      }

      try {
        const res = await api.get("/api/v1/resume/latest");
        if (mounted) {
          setResumeScore({
            ats_score: res.data.data.ats_score,
            resume_id: res.data.data.resume_id,
          });
        }
      } catch {
        /* no resume yet */
      }

      if (mounted) setLoading(false);
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const verStatus = user?.verification_status || "unverified";
  const badgeClass =
    verStatus === "verified"
      ? "badge-verified"
      : verStatus === "rejected"
      ? "badge-rejected"
      : "badge-unverified";

  return (
    <div className="stack-lg">
      {/* Readiness Strip */}
      {!loading && (
        <section className="readiness-strip">
          <div className="readiness-header">
            <span className={`verification-badge ${badgeClass}`}>
              {verStatus === "verified" ? "✓ Verified Student" : verStatus === "rejected" ? "✗ Verification Rejected" : "⚠ Unverified"}
            </span>
            {readiness && <span className="readiness-score">{readiness.score}% Profile Complete</span>}
          </div>
          {readiness && (
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${readiness.score}%` }} />
            </div>
          )}
          <div className="readiness-row">
            {readiness && readiness.missing.length > 0 && (
              <div className="readiness-actions">
                {readiness.missing.slice(0, 3).map((action) => (
                  <span className="readiness-action-chip" key={action}>{action}</span>
                ))}
              </div>
            )}
            <div className="readiness-metrics">
              {resumeScore ? (
                <span className="score-badge">ATS {resumeScore.ats_score}</span>
              ) : (
                <span className="meta-pill">No Resume Yet</span>
              )}
              <span className="meta-pill">Deadlines — Coming Soon</span>
            </div>
          </div>
        </section>
      )}

      {loading && <div className="empty-state">Loading your workspace...</div>}

      {/* Hero Panel */}
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Student Placement Workspace</p>
          <h1 className="hero-title">Track readiness, find eligible roles, and prepare for campus hiring.</h1>
          <p className="hero-text">
            FirstJob helps college students move from profile setup to resume review, recommendations, job discovery,
            and interview preparation in one clean workflow.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/resume">Analyze Resume</Link>
            <Link className="button" to="/matches">View Recommendations</Link>
          </div>
        </div>

        <div className="hero-side">
          <div className="hero-badge">Built for College Students</div>
          <div className="profile-graphic" aria-hidden="true">
            <div className="profile-card">
              <div className="profile-photo">
                <div className="profile-head" />
                <div className="profile-body" />
              </div>
              <div className="profile-lines">
                <span className="profile-line profile-line-strong" />
                <span className="profile-line" />
                <span className="profile-line profile-line-short" />
                <div className="profile-tags">
                  <span className="profile-tag">Resume</span>
                  <span className="profile-tag">Eligibility</span>
                </div>
              </div>
            </div>
          </div>
          <div className="hero-stat-grid">
            <article className="metric-card">
              <span className="metric-value">ATS</span>
              <p className="metric-label">Deterministic resume feedback with clear action points.</p>
            </article>
            <article className="metric-card">
              <span className="metric-value">Roles</span>
              <p className="metric-label">Curated campus-style opportunities with clean filters.</p>
            </article>
            <article className="metric-card">
              <span className="metric-value">Prep</span>
              <p className="metric-label">Structured revision material for fast interview preparation.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="grid-two dashboard-grid">
        <article className="panel product-card">
          <p className="eyebrow">Resume Intelligence</p>
          <h3>Understand how your resume reads before placement season.</h3>
          <p className="muted">
            Upload a PDF or TXT resume, refine your target role, and get role-aware feedback on missing skills,
            keyword alignment, and document structure.
          </p>
          <Link className="inline-link" to="/resume">Open Resume Analysis</Link>
        </article>

        <article className="panel product-card">
          <p className="eyebrow">Recommendations</p>
          <h3>Get role-aware suggestions that explain themselves.</h3>
          <p className="muted">
            Every recommendation highlights why it is relevant, what skills align, and where you still need to improve.
          </p>
          <Link className="inline-link" to="/matches">Open Recommendations</Link>
        </article>

        <article className="panel product-card">
          <p className="eyebrow">Eligible Jobs</p>
          <h3>See opportunities aligned with your current profile.</h3>
          <p className="muted">
            Browse curated listings, filter by role and location, and prepare for eligibility-aware placement matching.
          </p>
          <Link className="inline-link" to="/jobs">Explore Eligible Jobs</Link>
        </article>

        <article className="panel product-card">
          <p className="eyebrow">Prep Assistant</p>
          <h3>Turn topics into organized revision material.</h3>
          <p className="muted">
            Generate structured prep notes, reopen saved histories, and prepare faster with summaries, sections, and
            flashcards.
          </p>
          <Link className="inline-link" to="/notes">Open Prep</Link>
        </article>
      </section>
    </div>
  );
}
