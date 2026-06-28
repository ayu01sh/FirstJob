import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../shared/api/client";
import { type JobMatch, type MatchesResponseData } from "../../shared/types/product";
import { RecommendationCard } from "./components/RecommendationCard";

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
                <RecommendationCard key={m.job_id} match={m} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
