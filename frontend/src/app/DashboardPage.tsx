import { Link } from "react-router-dom";

export default function DashboardPage() {
  return (
    <div className="stack-lg">
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
