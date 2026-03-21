import { FormEvent, useEffect, useState } from "react";
import { api } from "../../shared/api/client";

type NoteItem = {
  id: string;
  topic: string;
  level: string;
  format: string;
  created_at: string;
};

export default function NotesPage() {
  const [topic, setTopic] = useState("Operating Systems");
  const [level, setLevel] = useState("beginner");
  const [format, setFormat] = useState("outline");
  const [history, setHistory] = useState<NoteItem[]>([]);
  const [latest, setLatest] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    const res = await api.get("/api/v1/notes");
    setHistory(res.data.data.items || []);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const onGenerate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await api.post("/api/v1/notes/generate", { topic, level, format });
    setLatest(res.data.data);
    await loadHistory();
    setLoading(false);
  };

  return (
    <div>
      <h3>Notes Generator + History</h3>
      <form className="form-inline" onSubmit={onGenerate}>
        <input value={topic} onChange={(e) => setTopic(e.target.value)} />
        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="beginner">beginner</option>
          <option value="intermediate">intermediate</option>
          <option value="advanced">advanced</option>
        </select>
        <select value={format} onChange={(e) => setFormat(e.target.value)}>
          <option value="outline">outline</option>
          <option value="bullets">bullets</option>
          <option value="flashcards">flashcards</option>
        </select>
        <button type="submit" disabled={loading}>{loading ? "Generating..." : "Generate"}</button>
      </form>

      {latest && (
        <div className="result">
          <p><strong>{latest.generated_content.title}</strong></p>
          <p>{latest.generated_content.summary}</p>
        </div>
      )}

      <h4>History</h4>
      <ul>
        {history.map((n) => (
          <li key={n.id}>{n.topic} - {n.level} - {new Date(n.created_at).toLocaleString()}</li>
        ))}
      </ul>
    </div>
  );
}
