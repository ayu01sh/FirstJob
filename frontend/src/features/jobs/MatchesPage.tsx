import { useEffect, useState } from "react";
import { api } from "../../shared/api/client";
import { type MatchesResponseData } from "../../shared/types/product";
import { RecommendationCard } from "./components/RecommendationCard";
import { PageHeader, EmptyState, Skeleton, Badge } from "../../components/ui";


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
        <PageHeader
          eyebrow="Recommendations V2"
          title="Placement-Aware Matches"
        />
        <div className="job-grid-enhanced stack-md" style={{ marginTop: "2rem" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ padding: "1.5rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", backgroundColor: "var(--surface)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                <div className="stack-sm" style={{ width: "60%" }}>
                  <Skeleton variant="title" width="80%" />
                  <Skeleton variant="text" width="40%" />
                </div>
                <Skeleton variant="rect" width={80} height={30} style={{ borderRadius: "20px" }} />
              </div>
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="text" width="90%" style={{ marginTop: "0.5rem" }} />
              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <Skeleton variant="text" width={100} />
                <Skeleton variant="text" width={100} />
                <Skeleton variant="text" width={100} />
              </div>
            </div>
          ))}
        </div>
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
      <PageHeader
        eyebrow="Recommendations V2"
        title="Placement-Aware Matches"
        description="Opportunities scored on skill overlap, ATS compatibility, preferences, and eligibility."
        actions={
          <label className="toggle-switch">
            <input type="checkbox" checked={eligibleOnly} onChange={(e) => setEligibleOnly(e.target.checked)} />
            <span className="toggle-slider"></span>
            <span className="toggle-label">Hide Ineligible / Stretch</span>
          </label>
        }
      />

      {error && <p className="error">{error}</p>}

      {summary && (
        <section className="card shell-card" style={{ padding: "1.25rem 1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <p className="eyebrow" style={{ marginBottom: "0.25rem" }}>Engine Source</p>
              <h4 style={{ margin: 0, fontWeight: 600, fontSize: "1.1rem" }}>
                {summary.source_type === "resume"
                  ? "Resume + Profile"
                  : summary.source_type === "profile"
                  ? "Profile Only (Fallback)"
                  : "Unavailable"}
              </h4>
            </div>
            <div>
              <Badge variant="warning">{summary.recommended_action}</Badge>
            </div>
          </div>
          {summary.readiness_warnings.length > 0 && (
            <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", backgroundColor: "var(--warning-light)", border: "1px solid rgba(245, 158, 11, 0.2)", borderRadius: "var(--radius)", color: "var(--warning-dark, #b45309)" }}>
              <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {summary.readiness_warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {!loading && items.length === 0 && (
        <EmptyState
          title="No Matches Found"
          description='We couldn"t find any roles matching your current skill set. Try updating your target role or turning off the "Hide Ineligible" filter.'
        />
      )}

      {loading && data && <div className="muted">Refreshing...</div>}

      <div className="stack-lg">
        {strongMatches.length > 0 && (
          <div className="match-tier">
            <h4 className="tier-title">Strong Matches</h4>
            <div className="job-grid-enhanced stack-md">
              {strongMatches.map((m) => (
                <RecommendationCard key={m.job_id} match={m} />
              ))}
            </div>
          </div>
        )}

        {goodMatches.length > 0 && (
          <div className="match-tier">
            <h4 className="tier-title">Good Matches</h4>
            <div className="job-grid-enhanced stack-md">
              {goodMatches.map((m) => (
                <RecommendationCard key={m.job_id} match={m} />
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
