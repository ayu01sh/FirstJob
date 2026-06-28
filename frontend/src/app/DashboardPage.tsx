import React, { useEffect, useState } from "react";
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
import { BaseCard, CardContent, Button } from "../components/ui";
import { CheckCircle2, Circle } from "lucide-react";

type ResumeScore = {
  ats_score: number;
  resume_id: string;
};

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
  const profileScore = readiness?.score || 0;
  const verStatus = user?.verification_status || "unverified";

  // Phase 2: Dynamic Onboarding Checklist Logic
  const checklist = [
    { id: 'profile', label: "Complete your profile", isDone: profileScore >= 50, href: "/profile" },
    { id: 'resume', label: "Upload your resume", isDone: !!resumeScore, href: "/resume" },
    { id: 'prep', label: "Take the prep quiz", isDone: false, href: "/prep" } // Hardcoded for now until prep API is connected
  ];
  const completedCount = checklist.filter(c => c.isDone).length;
  const progressPercent = Math.round((completedCount / checklist.length) * 100);

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
      {/* ── Hero Welcome Banner (Redesigned without confetti/svgs) ── */}
      <section className="hero-welcome">
        <div className="hero-welcome-content">
          <div className="hero-welcome-left" style={{ width: '100%' }}>
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

            <div style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.15)', borderRadius: 'var(--radius)', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600 }}>Profile Completion</span>
                <span>{progressPercent}%</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progressPercent}%`, background: 'white', transition: 'width 0.5s ease-out' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Onboarding Checklist (New in Phase 2) ── */}
      {progressPercent < 100 && (
        <section className="dashboard-section" style={{ marginTop: '-0.5rem' }}>
          <h3 className="section-heading">Onboarding Checklist</h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {checklist.map((item) => (
              <BaseCard hoverable key={item.id}>
                <CardContent style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {item.isDone ? (
                      <CheckCircle2 size={20} color="var(--success)" />
                    ) : (
                      <Circle size={20} color="var(--muted)" />
                    )}
                    <span style={{ 
                      fontWeight: 500, 
                      color: item.isDone ? 'var(--muted)' : 'var(--text)', 
                      textDecoration: item.isDone ? 'line-through' : 'none' 
                    }}>
                      {item.label}
                    </span>
                  </div>
                  <Link to={item.href}>
                    <Button variant={item.isDone ? "ghost" : "secondary"} size="sm">
                      {item.isDone ? "Review" : "Start"}
                    </Button>
                  </Link>
                </CardContent>
              </BaseCard>
            ))}
          </div>
        </section>
      )}

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
          style={{ "--feature-color": "var(--primary)" } as React.CSSProperties}
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
            <Link to="/matches">
              <Button variant="primary">View All</Button>
            </Link>
          </div>
          <div className="reco-grid">
            {topMatches.map((m) => (
              <BaseCard hoverable key={m.job_id}>
                <CardContent style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                </CardContent>
              </BaseCard>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
