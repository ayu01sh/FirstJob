import { useEffect, useState } from "react";
import { api } from "../../shared/api/client";

type Match = {
  job_id: string;
  title: string;
  company: string;
  score: number;
  reasons: string[];
};

export default function MatchesPage() {
  const [sourceSkills, setSourceSkills] = useState<string[]>([]);
  const [sourceType, setSourceType] = useState("none");
  const [needsResume, setNeedsResume] = useState(false);
  const [items, setItems] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadMatches = async () => {
      try {
        const res = await api.get("/api/v1/jobs/matches/me");
        if (!mounted) {
          return;
        }
        setSourceSkills(res.data.data.source_skills || []);
        setSourceType(res.data.data.source_type || "none");
        setNeedsResume(Boolean(res.data.data.needs_resume));
        setItems(res.data.data.items || []);
      } catch (err: any) {
        if (mounted) {
          setError(err?.response?.data?.error?.details?.[0] || "Could not load your job matches.");
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
  }, []);

  return (
    <div className="stack-lg">
      <section className="section-block">
        <p className="eyebrow">Matches</p>
        <h3>Top Recommendations</h3>
        <p className="muted">Recommendations only appear when the system has a real skill source to work from.</p>
      </section>

      {loading && <div className="empty-state">Calculating your matches...</div>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <>
          <div className="panel">
            <div className="row wrap">
              <div>
                <p className="eyebrow">Matching Source</p>
                <h4>{sourceType === "resume" ? "Latest Resume" : sourceType === "profile" ? "Profile Fallback" : "Unavailable"}</h4>
              </div>
              <span className="meta-pill">{sourceSkills.length} {sourceSkills.length === 1 ? "Skill" : "Skills"}</span>
            </div>
            <p className="muted">{sourceSkills.join(", ") || "No skills found yet"}</p>
          </div>

          {needsResume && (
            <div className="empty-state">
              <p className="eyebrow">Resume Needed</p>
              <p>Upload a resume first so the platform can compute meaningful job matches.</p>
            </div>
          )}

          {!needsResume && items.length === 0 && (
            <div className="empty-state">
              <p className="eyebrow">No Strong Matches</p>
              <p>Try uploading a more detailed resume or refining the target role on the Resume page.</p>
            </div>
          )}

          <div className="job-grid">
            {items.map((m) => (
              <article className="panel" key={m.job_id}>
                <div className="row wrap">
                  <div>
                    <p className="eyebrow">Match</p>
                    <h4>{m.title}</h4>
                    <p className="muted">{m.company}</p>
                  </div>
                  <div className="score-badge">Score {m.score}</div>
                </div>
                <ul className="list-clean">
                  {m.reasons.map((r) => <li key={r}>{r}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
