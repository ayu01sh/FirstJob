import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../shared/api/client";
import { type JobMatch, type MatchesResponseData } from "../../shared/types/product";

export default function MatchesPage() {
  const [data, setData] = useState<MatchesResponseData | null>(null);
  const [eligibleOnly, setEligibleOnly] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadMatches = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/api/v1/jobs/matches/me", {
          params: { eligible_only: eligibleOnly },
        });
        if (mounted) {
          setData(res.data.data);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err?.response?.data?.error?.details?.[0] || "Could not load your recommendations.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadMatches();

    return () => {
      mounted = false;
    };
  }, [eligibleOnly]);

  if (loading && !data) {
    return (
      <div className="stack-lg">
        <section className="section-block">
          <header className="page-header">
            <p className="eyebrow">Recommendations V2</p>
            <h3>Placement-Aware Matches</h3>
          </header>
        </section>
        <div className="empty-state">Computing recommendations based on your profile, resume, and eligibility...</div>
      </div>
    );
  }

  const items = data?.items || [];
  const summary = data?.source_summary;

  const strongMatches = items.filter((i) => i.fit_level === "strong");
  const goodMatches = items.filter((i) => i.fit_level === "good");
  const stretchMatches = items.filter((i) => i.fit_level === "stretch");

  return (
    <div className="stack-lg">
      <section className="section-block">
        <div className="row wrap">
          <header className="page-header">
            <p className="eyebrow">Recommendations V2</p>
            <h3>Placement-Aware Matches</h3>
            <p className="muted">
              Opportunities scored on skill overlap, ATS compatibility, preferences, and eligibility.
            </p>
          </header>
          <div className="filter-row toggle-row" style={{ borderTop: "none", paddingTop: 0 }}>
            <label className="toggle-switch">
              <input type="checkbox" checked={eligibleOnly} onChange={(e) => setEligibleOnly(e.target.checked)} />
              <span className="toggle-slider"></span>
              <span className="toggle-label">Hide Ineligible / Stretch</span>
            </label>
          </div>
        </div>
      </section>

      {error && <p className="error">{error}</p>}

      {summary && (
        <section className="readiness-strip">
          <div className="readiness-row">
            <div>
              <p className="eyebrow">Engine Source</p>
              <h4>
                {summary.source_type === "resume"
                  ? "Resume + Profile"
                  : summary.source_type === "profile"
                  ? "Profile Only (Fallback)"
                  : "Unavailable"}
              </h4>
            </div>
            <div className="readiness-actions">
              <span className="readiness-action-chip">{summary.recommended_action}</span>
            </div>
          </div>
          {summary.readiness_warnings.length > 0 && (
            <div className="job-reasons-preview" style={{ marginTop: "0.5rem" }}>
              <ul className="list-clean">
                {summary.readiness_warnings.map((w, i) => (
                  <li key={i}>⚠ {w}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {!loading && items.length === 0 && (
        <div className="empty-state">
          <p className="eyebrow">No Matches Found</p>
          <p>We couldn't find any roles matching your current skill set. Try updating your target role or turning off the "Hide Ineligible" filter.</p>
        </div>
      )}

      {loading && data && <div className="muted">Refreshing...</div>}

      <div className="stack-lg">
        {strongMatches.length > 0 && (
          <div className="match-tier">
            <h4 className="tier-title">Strong Matches</h4>
            <div className="job-grid-enhanced stack-md">
              {strongMatches.map((m) => (
                <MatchCard key={m.job_id} match={m} />
              ))}
            </div>
          </div>
        )}

        {goodMatches.length > 0 && (
          <div className="match-tier">
            <h4 className="tier-title">Good Matches</h4>
            <div className="job-grid-enhanced stack-md">
              {goodMatches.map((m) => (
                <MatchCard key={m.job_id} match={m} />
              ))}
            </div>
          </div>
        )}

        {stretchMatches.length > 0 && (
          <div className="match-tier">
            <h4 className="tier-title">Stretch / Ineligible Roles</h4>
            <div className="job-grid-enhanced stack-md opacity-dim">
              {stretchMatches.map((m) => (
                <MatchCard key={m.job_id} match={m} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: JobMatch }) {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleTrack = async () => {
    setSaving(true);
    try {
      await api.post("/api/v1/applications", {
        job_id: match.job_id,
        status: "saved",
        source: "matches_page"
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert("Failed to track: " + (err?.response?.data?.error?.details?.[0] || err.message));
    } finally {
      setSaving(false);
    }
  };

  const eBadgeClass =
    match.eligibility_status === "eligible"
      ? "elig-eligible"
      : match.eligibility_status === "almost_eligible"
      ? "elig-almost"
      : "elig-not";

  const fitBadgeClass = `fit-${match.fit_level}`;

  return (
    <article className="job-card-enhanced panel">
      <div className="job-card-header">
        <div className="job-card-title-group">
          <div className="row wrap" style={{ gap: "0.5rem" }}>
            <span className={`fit-badge ${fitBadgeClass}`}>
              {match.fit_level.toUpperCase()} (Score: {match.score})
            </span>
            <span className={`eligibility-badge ${eBadgeClass}`}>
              {match.eligibility_status === "eligible" ? "Eligible" : "Not Eligible"}
            </span>
          </div>
          <h4 style={{ marginTop: "0.5rem" }}>{match.title}</h4>
          <p className="muted">{match.company}</p>
        </div>
        <div className="job-card-status">
          <div className="row" style={{ gap: "0.5rem" }}>
            <button className="button" onClick={handleTrack} disabled={saving}>
              {success ? "Saved ✓" : "Save Job"}
            </button>
            <Link className="button button-primary" to={`/jobs`}>View & Apply</Link>
          </div>
          {match.deadline_days_left !== null && (
            <span className="deadline-chip" style={{ alignSelf: "flex-end", marginTop: "0.5rem" }}>{match.deadline_days_left}d left</span>
          )}
        </div>
      </div>

      <div className="grid-two" style={{ marginTop: "1rem", gap: "1rem" }}>
        <div className="reasons-block">
          <p className="eyebrow">Why this job?</p>
          <ul className="list-clean text-sm">
            {match.reasons.map((r, i) => (
              <li key={i}>✓ {r}</li>
            ))}
          </ul>
        </div>
        <div className="skills-block">
          {match.missing_skills.length > 0 ? (
            <>
              <p className="eyebrow" style={{ color: "#b9770e" }}>Skill Gaps</p>
              <div className="chip-row">
                {match.missing_skills.slice(0, 4).map((s) => (
                  <span className="chip" key={s} style={{ background: "#fffaf0", borderColor: "#ffcc80" }}>
                    {s}
                  </span>
                ))}
                {match.missing_skills.length > 4 && <span className="muted text-sm">+{match.missing_skills.length - 4} more</span>}
              </div>
            </>
          ) : (
            <>
              <p className="eyebrow" style={{ color: "#1b5e20" }}>Matched Skills</p>
              <div className="chip-row">
                {match.matched_skills.slice(0, 4).map((s) => (
                  <span className="chip" key={s} style={{ background: "#e8f5e3", borderColor: "#c8e6c9" }}>
                    {s}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {match.eligibility_status !== "eligible" && match.eligibility_reasons.length > 0 && (
        <div className="job-reasons-preview" style={{ marginTop: "1rem" }}>
          <span className="reason-label">⚠ {match.eligibility_reasons[0]}</span>
          {match.eligibility_reasons.length > 1 && (
            <span className="muted"> + {match.eligibility_reasons.length - 1} more</span>
          )}
        </div>
      )}

      <div className="match-footer" style={{ marginTop: "1rem", paddingTop: "0.5rem", borderTop: "1px solid var(--border)" }}>
        <span className="text-sm font-bold">Suggested Action: </span>
        <span className="text-sm">{match.next_action}</span>
      </div>
    </article>
  );
}
