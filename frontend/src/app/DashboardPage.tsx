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
import { type JobMatch } from "../shared/types/product";

type ResumeScore = {
  ats_score: number;
  resume_id: string;
};

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [readiness, setReadiness] = useState<ReadinessData | null>(null);
  const [resumeScore, setResumeScore] = useState<ResumeScore | null>(null);
  const [topMatches, setTopMatches] = useState<JobMatch[]>([]);
  const [apps, setApps] = useState<any[]>([]);
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

      try {
        const mRes = await api.get("/api/v1/jobs/matches/me", { params: { limit: 3, eligible_only: true } });
        if (mounted) {
          setTopMatches(mRes.data.data.items || []);
        }
      } catch {
        /* best-effort matches */
      }

      try {
        const appRes = await api.get("/api/v1/applications");
        if (mounted) {
          setApps(appRes.data.data || []);
        }
      } catch {
        /* best-effort apps */
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
              {apps.length > 0 ? (
                <Link to="/applications" className="score-badge" style={{ textDecoration: 'none' }}>
                  {apps.length} Active {apps.length === 1 ? "App" : "Apps"}
                </Link>
              ) : (
                <span className="meta-pill">No Applications Tracked</span>
              )}
            </div>
          </div>
        </section>
      )}

      {loading && <div className="empty-state">Loading your workspace...</div>}


      {/* Top Recommendations */}
      {!loading && topMatches.length > 0 && (
        <section className="dashboard-matches-section panel">
          <div className="row wrap" style={{ marginBottom: "1rem" }}>
            <div>
              <p className="eyebrow">Top Recommendations</p>
              <h3>Best Actionable Matches</h3>
            </div>
            <Link className="button" to="/matches">See All</Link>
          </div>
          <div className="job-grid">
            {topMatches.map((m) => (
              <article className="panel" key={m.job_id} style={{ background: "var(--surface)" }}>
                <div className="row wrap">
                  <div>
                    <span className={`fit-badge fit-${m.fit_level}`} style={{ display: "inline-block", marginBottom: "0.25rem" }}>
                      {m.fit_level.toUpperCase()}
                    </span>
                    <h4>{m.title}</h4>
                    <p className="muted text-sm">{m.company}</p>
                  </div>
                </div>
                <div style={{ marginTop: "0.75rem", fontSize: "0.85rem" }}>
                  <span className="font-bold">Action: </span>{m.next_action}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

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
