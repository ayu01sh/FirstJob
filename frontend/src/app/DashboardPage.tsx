import { Link } from "react-router-dom";

export default function DashboardPage() {
  return (
    <div className="stack-lg">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Career Platform</p>
          <h1 className="hero-title">Build a sharper profile, discover better roles, and prepare with focus.</h1>
          <p className="hero-text">
            FirstJob helps fresh graduates move from resume cleanup to job discovery and study preparation in one
            clean workflow.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/resume">Analyze Resume</Link>
            <Link className="button" to="/matches">View Matches</Link>
          </div>
        </div>

        <div className="hero-side">
          <div className="hero-badge">Focused for Freshers</div>
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
                  <span className="profile-tag">Role Match</span>
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
              <p className="metric-label">Curated entry-level opportunities with clean filters.</p>
            </article>
            <article className="metric-card">
              <span className="metric-value">Notes</span>
              <p className="metric-label">Structured learning notes for fast interview preparation.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="grid-two dashboard-grid">
        <article className="panel product-card">
          <p className="eyebrow">Resume Intelligence</p>
          <h3>Understand how your profile reads before you apply.</h3>
          <p className="muted">
            Upload a PDF or TXT resume, refine your target role, and get role-aware feedback on missing skills,
            keyword alignment, and document structure.
          </p>
          <Link className="inline-link" to="/resume">Open Resume Analysis</Link>
        </article>

        <article className="panel product-card">
          <p className="eyebrow">Smart Recommendations</p>
          <h3>Get role-matched suggestions that explain themselves.</h3>
          <p className="muted">
            Every match highlights why it is relevant, what skills align, and where you still need to improve.
          </p>
          <Link className="inline-link" to="/matches">Open Top Matches</Link>
        </article>

        <article className="panel product-card">
          <p className="eyebrow">Role Discovery</p>
          <h3>See opportunities that fit your current skill profile.</h3>
          <p className="muted">
            Browse curated listings, filter by role and location, and review job matches generated from your latest
            resume.
          </p>
          <Link className="inline-link" to="/jobs">Explore Jobs</Link>
        </article>

        <article className="panel product-card">
          <p className="eyebrow">Learning Assistant</p>
          <h3>Turn topics into organized revision material.</h3>
          <p className="muted">
            Generate structured notes, reopen saved histories, and prepare faster with summaries, sections, and
            flashcards.
          </p>
          <Link className="inline-link" to="/notes">Generate Notes</Link>
        </article>
      </section>
    </div>
  );
}
