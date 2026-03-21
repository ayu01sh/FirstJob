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
  const [items, setItems] = useState<Match[]>([]);

  useEffect(() => {
    api.get("/api/v1/jobs/matches/me").then((res) => {
      setSourceSkills(res.data.data.source_skills || []);
      setItems(res.data.data.items || []);
    });
  }, []);

  return (
    <div>
      <h3>Top Matches</h3>
      <p><strong>Source Skills:</strong> {sourceSkills.join(", ") || "No skills found yet"}</p>
      <ul>
        {items.map((m) => (
          <li key={m.job_id}>
            <strong>{m.title}</strong> - {m.company} | Score: {m.score}
            <ul>
              {m.reasons.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
