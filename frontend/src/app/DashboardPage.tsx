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

/* ── Circular Progress Ring ── */
function CircularProgress({ percentage }: { percentage: number }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percentage / 100) * circ;
  return (
    <div className="progress-ring-container">
      <svg className="progress-ring" width="88" height="88" viewBox="0 0 88 88">
        <circle className="progress-ring-bg" cx="44" cy="44" r={r} />
        <circle
          className="progress-ring-fill"
          cx="44"
          cy="44"
          r={r}
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="progress-ring-text">{percentage}%</span>
    </div>
  );
}

/* ── Company avatar color from name ── */
function getCompanyColor(company: string): string {
  const colors = [
    "#2563eb", "#059669", "#7c3aed", "#dc2626",
    "#d97706", "#0891b2", "#c026d3", "#4f46e5",
  ];
  let hash = 0;
  for (let i = 0; i < (company || "").length; i++) {
    hash = company.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

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
        const mRes = await api.get("/api/v1/jobs/matches/me", {
          params: { limit: 3, eligible_only: true },
        });
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

  const displayName = user?.name?.trim() || "Student";
  const verStatus = user?.verification_status || "unverified";
  const profileScore = readiness?.score || 0;

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <p>Loading your workspace...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* ── Hero Welcome Banner ── */}
      <section className="hero-welcome">
        <div className="hero-welcome-decor hero-welcome-decor-1" />
        <div className="hero-welcome-decor hero-welcome-decor-2" />
        <div className="hero-welcome-content">
          <div className="hero-welcome-left">
            <div className="hero-welcome-badge">
              {verStatus === "verified" ? "✓ Verified Student" : "⚠ Profile Incomplete"}
            </div>
            <h1 className="hero-welcome-title">
              Welcome back, {displayName} 👋
            </h1>
            <p className="hero-welcome-sub">
              {profileScore < 50
                ? "Complete your placement profile to unlock better job matches and recommendations."
                : profileScore < 100
                ? "Great progress! A few more steps to maximize your placement readiness."
                : "Your profile is placement-ready. Focus on applying and preparing for interviews!"}
            </p>
            {readiness && readiness.missing.length > 0 && (
              <div className="hero-actions-row">
                {readiness.missing.slice(0, 3).map((action) => (
                  <span className="hero-action-chip" key={action}>
                    {action}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="hero-welcome-right">
            <CircularProgress percentage={profileScore} />
            <div className="hero-stats-row">
              <div className="hero-stat-mini">
                <span className="hero-stat-mini-value">
                  {verStatus === "verified" ? "✓" : "!"}
                </span>
                <span className="hero-stat-mini-label">
                  {verStatus === "verified" ? "Verified" : "Unverified"}
                </span>
              </div>
              <div className="hero-stat-mini">
                <span className="hero-stat-mini-value">
                  {resumeScore ? resumeScore.ats_score : "—"}
                </span>
                <span className="hero-stat-mini-label">ATS Score</span>
              </div>
              <div className="hero-stat-mini">
                <span className="hero-stat-mini-value">{apps.length}</span>
                <span className="hero-stat-mini-label">
                  {apps.length === 1 ? "Application" : "Applications"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Cards ── */}
      <section className="feature-grid">
        <Link
          to="/matches"
          className="feature-card"
          style={{ "--feature-color": "#059669" } as React.CSSProperties}
        >
          <div className="icon-circle icon-circle-green">
            <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 2l1.6 5h5.4l-4.4 3.2 1.6 5-4.2-3.2-4.2 3.2 1.6-5-4.4-3.2h5.4L10 2z" />
            </svg>
          </div>
          <h3 className="feature-card-title">Recommendations</h3>
          <p className="feature-card-desc">
            Discover placement-aware matches tailored to your profile, skills, and eligibility.
          </p>
          <span className="feature-card-link">View Matches →</span>
        </Link>

        <Link
          to="/applications"
          className="feature-card"
          style={{ "--feature-color": "var(--primary)" } as React.CSSProperties}
        >
          <div className="icon-circle icon-circle-blue">
            <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="16" height="12" rx="2" />
              <path d="M6 8h8" />
              <path d="M6 12h5" />
            </svg>
          </div>
          <h3 className="feature-card-title">Application Tracker</h3>
          <p className="feature-card-desc">
            Keep track of your saved jobs, ongoing applications, and upcoming interviews.
          </p>
          <span className="feature-card-link">Open Tracker →</span>
        </Link>

        <Link
          to="/resume"
          className="feature-card"
          style={{ "--feature-color": "#2563eb" } as React.CSSProperties}
        >
          <div className="icon-circle icon-circle-blue">
            <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 2.5h7l4 4V17a1 1 0 01-1 1H5a1 1 0 01-1-1V3.5A1 1 0 015 2.5z" />
              <path d="M12 2.5v4h4" />
              <line x1="7" y1="10" x2="13" y2="10" />
              <line x1="7" y1="13" x2="13" y2="13" />
            </svg>
          </div>
          <h3 className="feature-card-title">Resume Intelligence</h3>
          <p className="feature-card-desc">
            Upload your resume, get ATS feedback, and discover missing skills before placement season.
          </p>
          <span className="feature-card-link">Analyze Resume →</span>
        </Link>
      </section>

      {/* ── Top Recommendations ── */}
      {topMatches.length > 0 && (
        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <div>
              <p className="eyebrow">Top Recommendations</p>
              <h3>Best Matches For You</h3>
            </div>
            <Link className="button button-primary" to="/matches">
              View All
            </Link>
          </div>
          <div className="reco-grid">
            {topMatches.map((m) => (
              <article className="reco-card" key={m.job_id}>
                <div className="reco-card-top">
                  <div
                    className="company-avatar"
                    style={
                      {
                        "--company-color": getCompanyColor(m.company),
                      } as React.CSSProperties
                    }
                  >
                    {m.company?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <h4 className="reco-card-title">{m.title}</h4>
                    <p className="reco-card-company">{m.company}</p>
                  </div>
                </div>
                <div className="reco-card-fit">
                  <span className={`fit-badge fit-${m.fit_level}`}>
                    {m.fit_level.toUpperCase()}
                  </span>
                  {m.deadline_days_left !== null && (
                    <span className="deadline-chip">
                      {m.deadline_days_left}d left
                    </span>
                  )}
                </div>
                <p className="reco-card-action">
                  <strong>Next: </strong>
                  {m.next_action}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
