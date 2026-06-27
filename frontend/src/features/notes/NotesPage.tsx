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
  const [deletingId, setDeletingId] = useState("");
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
    setSelectedNote(null);
    try {
      const res = await api.post("/api/v1/notes/generate", { topic, level, format });
      setSelectedNote(res.data.data);
      await loadHistory();
    } catch (err: any) {
      setSelectedNote(null);
      setError(err?.response?.data?.error?.details?.[0] || "Could not generate the prep material.");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (noteId: string) => {
    setDeletingId(noteId);
    setError("");
    try {
      await api.delete(`/api/v1/notes/${noteId}`);
      setHistory((current) => current.filter((item) => item.id !== noteId));
      setSelectedNote((current) => {
        const currentId = current?.id || current?.note_id;
        return currentId === noteId ? null : current;
      });
    } catch (err: any) {
      setError(err?.response?.data?.error?.details?.[0] || "Could not delete the note.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="stack-lg">
      <section className="section-block">
        <header className="page-header">
          <p className="eyebrow">Prep</p>
          <h3>Generate Structured Interview Prep</h3>
          <p className="muted">Generate structured prep material with your local Ollama model. If Ollama is unavailable or returns invalid output, the exact error is shown here.</p>
        </header>
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
              <h4>Saved Prep</h4>
            </div>
            <span className="meta-pill">{history.length} {history.length === 1 ? "Item" : "Items"}</span>
          </div>
          {historyLoading && <div className="empty-state">Loading note history...</div>}
          {!historyLoading && history.length === 0 && (
            <div className="empty-state">
              <p className="eyebrow">No Prep Yet</p>
              <p>Generate your first prep item to populate this history panel.</p>
            </div>
          )}
          <div className="history-list">
            {history.map((n) => (
              <div className="history-row" key={n.id}>
                <button className="history-item" onClick={() => loadNote(n.id)} type="button">
                  <span className="history-topic">{n.topic}</span>
                  <span className="muted mono history-date">{new Date(n.created_at).toLocaleDateString()}</span>
                </button>
                <button
                  className="button history-delete history-delete-icon"
                  onClick={() => onDelete(n.id)}
                  type="button"
                  disabled={deletingId === n.id}
                  aria-label={`Delete ${n.topic}`}
                  title={`Delete ${n.topic}`}
                >
                  {deletingId === n.id ? (
                    "..."
                  ) : (
                    <svg aria-hidden="true" className="trash-icon" viewBox="0 0 24 24">
                      <path
                        d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 7h2v8h-2v-8Zm4 0h2v8h-2v-8ZM7 8h10l-.7 11.2A2 2 0 0 1 14.3 21H9.7a2 2 0 0 1-2-1.8L7 8Z"
                        fill="currentColor"
                      />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="panel stack-md">
          <div className="row wrap">
            <div>
              <p className="eyebrow">Detail</p>
              <h4>{selectedNote?.generated_content.title || "Select a Note"}</h4>
            </div>
            <div className="row wrap">
              {selectedNote?.format && <span className="meta-pill">{selectedNote.format}</span>}
              {selectedNote && (
                <button
                  className="button history-delete history-delete-icon"
                  onClick={() => onDelete(selectedNote.id || selectedNote.note_id || "")}
                  type="button"
                  disabled={deletingId === (selectedNote.id || selectedNote.note_id || "")}
                  aria-label={`Delete ${selectedNote.topic}`}
                  title={`Delete ${selectedNote.topic}`}
                >
                  {deletingId === (selectedNote.id || selectedNote.note_id || "") ? (
                    "..."
                  ) : (
                    <svg aria-hidden="true" className="trash-icon" viewBox="0 0 24 24">
                      <path
                        d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 7h2v8h-2v-8Zm4 0h2v8h-2v-8ZM7 8h10l-.7 11.2A2 2 0 0 1 14.3 21H9.7a2 2 0 0 1-2-1.8L7 8Z"
                        fill="currentColor"
                      />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>

          {detailLoading && <div className="empty-state">Loading note details...</div>}
          {!detailLoading && !selectedNote && (
            <div className="empty-state">
              <p>Generate a new prep item or select one from history to inspect the full structured content.</p>
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
