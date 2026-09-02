import React, { useState } from "react";
import { X, Search, Sparkles, Send, BookOpen, FileText, ArrowRight } from "lucide-react";
import { api } from "../services/api";
import MarkdownRenderer from "./MarkdownRenderer";
import VoiceInputButton from "./VoiceInputButton";



export default function GlobalChatModal({ isOpen, onClose, onSelectDocument }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleGlobalSearch = async (e) => {
    e?.preventDefault();
    if (!question.trim() || loading) return;

    setLoading(true);
    setError("");
    try {
      const res = await api.study.globalChat(question.trim());
      setResults(res);
    } catch (err) {
      setError(err.message || "Failed to search library.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0, 0, 0, 0.75)",
      backdropFilter: "blur(10px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 100,
      padding: "20px"
    }}>
      <div className="glass-panel animate-fade-in" style={{
        maxWidth: "720px",
        width: "100%",
        maxHeight: "85vh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        border: "1px solid var(--border-highlight)",
        overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--bg-card)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, var(--primary), var(--secondary))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff"
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.15rem" }}>Cross-Document AI Search</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                Ask a question to search and synthesize answers across all your PDFs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "none",
              color: "var(--text-dim)",
              padding: "6px",
              borderRadius: "50%"
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <form onSubmit={handleGlobalSearch} style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <VoiceInputButton
              onTranscript={(spokenText) => {
                setQuestion((prev) => (prev ? `${prev} ${spokenText}` : spokenText));
              }}
              disabled={loading}
            />
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={18} color="var(--text-dim)" style={{ position: "absolute", left: "14px", top: "14px" }} />
              <input
                type="text"
                placeholder="Ask any question across your uploaded documents (or click mic to speak)..."
                className="input-field"
                style={{ paddingLeft: "42px" }}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !question.trim()}
              style={{ padding: "0 24px", height: "46px" }}
            >
              {loading ? "Searching..." : <Send size={18} />}
            </button>
          </div>
        </form>


        {/* Content / Results */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {error && (
            <div style={{
              background: "rgba(244, 63, 94, 0.15)",
              color: "#fb7185",
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              fontSize: "0.9rem"
            }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-dim)" }}>
              <Sparkles className="animate-spin" size={28} color="var(--primary)" style={{ marginBottom: "12px" }} />
              <p>Scanning all indexed document chunks in your library...</p>
            </div>
          ) : results ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Synthesized Answer */}
              <div style={{
                background: "var(--bg-glass)",
                padding: "20px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-highlight)",
                fontSize: "0.95rem",
                color: "var(--text-main)"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                  paddingBottom: "8px",
                  borderBottom: "1px solid var(--border-subtle)",
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "var(--primary)",
                    fontWeight: "700",
                    fontSize: "0.85rem",
                    textTransform: "uppercase"
                  }}>
                    <Sparkles size={16} />
                    <span>Synthesized AI Answer</span>
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(results.answer);
                      alert("Answer copied to clipboard!");
                    }}
                    className="btn-secondary"
                    style={{ padding: "4px 8px", fontSize: "0.75rem", background: "var(--bg-card)" }}
                  >
                    Copy Answer
                  </button>
                </div>
                <MarkdownRenderer content={results.answer} />
              </div>


              {/* Citations / Sources */}
              {results.sources && results.sources.length > 0 && (
                <div>
                  <h4 style={{ fontSize: "0.95rem", marginBottom: "12px", color: "var(--text-muted)" }}>
                    Cross-Document Sources & References ({results.sources.length}):
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {results.sources.map((src, sIdx) => (
                      <div
                        key={sIdx}
                        style={{
                          background: "var(--bg-glass)",
                          padding: "12px 16px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--border-subtle)",
                          fontSize: "0.85rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontWeight: "600", color: "var(--primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                            <FileText size={14} />
                            {src.document_title}
                            {src.page_number && <span style={{ color: "var(--text-dim)" }}>• Page {src.page_number}</span>}
                          </span>
                        </div>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", margin: 0 }}>
                          "{src.content}"
                        </p>
                      </div>
                    ))}

                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-dim)" }}>
              <BookOpen size={40} color="var(--primary)" style={{ opacity: 0.4, marginBottom: "12px" }} />
              <h4>Search Across All Documents</h4>
              <p style={{ fontSize: "0.85rem", maxWidth: "420px", margin: "8px auto 0" }}>
                Type any topic to find where it is explained across multiple textbooks or course notes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
