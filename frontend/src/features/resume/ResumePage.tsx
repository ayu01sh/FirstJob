import { FormEvent, useState } from "react";
import { api } from "../../shared/api/client";

type ResumeData = {
  resume_id: string;
  filename: string;
  extracted_skills: string[];
  ats_score: number;
  missing_skills: string[];
  suggestions: string[];
};

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<ResumeData | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await api.post("/api/v1/resume/upload", form);
      setData(res.data.data);
    } catch (err: any) {
      setError(err?.response?.data?.error?.details?.[0] || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>Resume Upload + Analysis</h3>
      <form onSubmit={onSubmit} className="form">
        <input type="file" accept=".pdf,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button disabled={loading || !file} type="submit">
          {loading ? "Analyzing..." : "Upload Resume"}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
      {data && (
        <div className="result">
          <p><strong>ATS Score:</strong> {data.ats_score}</p>
          <p><strong>Skills:</strong> {data.extracted_skills.join(", ") || "None"}</p>
          <p><strong>Missing:</strong> {data.missing_skills.slice(0, 5).join(", ") || "None"}</p>
          <ul>
            {data.suggestions.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
