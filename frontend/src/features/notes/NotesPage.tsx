import { FormEvent, useEffect, useState } from "react";
import { api } from "../../shared/api/client";

type NoteItem = {
  id: string;
  topic: string;
  level: string;
  format: string;
  created_at: string;
};

type NoteContent = {
  title: string;
  summary: string;
  sections: Array<{ heading: string; points: string[] }>;
  key_points: string[];
  flashcards: Array<{ question: string; answer: string }>;
};

type NoteDetail = {
  id?: string;
  note_id?: string;
  topic: string;
  level: string;
  format: string;
  generated_content: NoteContent;
  created_at?: string;
};

export default function NotesPage() {
  const [topic, setTopic] = useState("Operating Systems");
  const [level, setLevel] = useState("beginner");
  const [format, setFormat] = useState("outline");
  const [history, setHistory] = useState<NoteItem[]>([]);
  const [selectedNote, setSelectedNote] = useState<NoteDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get("/api/v1/notes");
      setHistory(res.data.data.items || []);
    } catch (err: any) {
      setError(err?.response?.data?.error?.details?.[0] || "Could not load the note history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadNote = async (noteId: string) => {
    setDetailLoading(true);
    setError("");
    try {
      const res = await api.get(`/api/v1/notes/${noteId}`);
      setSelectedNote(res.data.data);
    } catch (err: any) {
      setError(err?.response?.data?.error?.details?.[0] || "Could not load the note details.");
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const onGenerate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/v1/notes/generate", { topic, level, format });
      setSelectedNote(res.data.data);
      await loadHistory();
    } catch (err: any) {
      setError(err?.response?.data?.error?.details?.[0] || "Could not generate the notes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stack-lg">
      <section className="section-block">
        <p className="eyebrow">Notes</p>
        <h3>Generate Structured Study Notes</h3>
        <p className="muted">Generate structured notes with AI when available, with a free local fallback to keep study mode available.</p>
      </section>
      <form className="form-inline" onSubmit={onGenerate}>
        <input aria-label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)} />
        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <select value={format} onChange={(e) => setFormat(e.target.value)}>
          <option value="outline">Outline</option>
          <option value="bullets">Bullets</option>
          <option value="flashcards">Flashcards</option>
        </select>
        <button className="button button-primary" type="submit" disabled={loading}>{loading ? "Generating..." : "Generate"}</button>
      </form>
      {error && <p className="error">{error}</p>}

      <div className="notes-layout">
        <section className="panel stack-md">
          <div className="row wrap">
            <div>
              <p className="eyebrow">History</p>
              <h4>Saved Notes</h4>
            </div>
            <span className="meta-pill">{history.length} {history.length === 1 ? "Item" : "Items"}</span>
          </div>
          {historyLoading && <div className="empty-state">Loading note history...</div>}
          {!historyLoading && history.length === 0 && (
            <div className="empty-state">
              <p className="eyebrow">No Notes Yet</p>
              <p>Generate your first set of notes to populate this history panel.</p>
            </div>
          )}
          <div className="history-list">
            {history.map((n) => (
              <button className="history-item" key={n.id} onClick={() => loadNote(n.id)} type="button">
                <span>{n.topic}</span>
                <span className="muted mono">{new Date(n.created_at).toLocaleDateString()}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="panel stack-md">
          <div className="row wrap">
            <div>
              <p className="eyebrow">Detail</p>
              <h4>{selectedNote?.generated_content.title || "Select a Note"}</h4>
            </div>
            {selectedNote?.format && <span className="meta-pill">{selectedNote.format}</span>}
          </div>

          {detailLoading && <div className="empty-state">Loading note details...</div>}
          {!detailLoading && !selectedNote && (
            <div className="empty-state">
              <p>Generate a new note or select one from history to inspect the full structured content.</p>
            </div>
          )}

          {selectedNote && !detailLoading && (
            <div className="stack-md">
              <p className="muted">{selectedNote.generated_content.summary}</p>

              <div className="stack-sm">
                <p><strong>Sections</strong></p>
                {selectedNote.generated_content.sections.map((section) => (
                  <div className="sub-panel" key={section.heading}>
                    <p className="section-heading">{section.heading}</p>
                    <ul className="list-clean">
                      {section.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="stack-sm">
                <p><strong>Key Points</strong></p>
                <ul className="list-clean">
                  {selectedNote.generated_content.key_points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>

              <div className="stack-sm">
                <p><strong>Flashcards</strong></p>
                {selectedNote.generated_content.flashcards.length === 0 && <p className="muted">No flashcards are available for this note format.</p>}
                {selectedNote.generated_content.flashcards.map((flashcard) => (
                  <div className="sub-panel" key={flashcard.question}>
                    <p className="section-heading">{flashcard.question}</p>
                    <p className="muted">{flashcard.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
