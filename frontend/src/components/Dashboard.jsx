import React, { useState, useEffect } from "react";
import { 
  UploadCloud, FileText, Trash2, ArrowRight, BookOpen, 
  Sparkles, Clock, Search, BrainCircuit, Tag, Globe,
  Award, Layers, CheckCircle, Lock, LogIn
} from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import GlobalChatModal from "./GlobalChatModal";

export default function Dashboard({ onSelectDocument, onRequireAuth }) {
  const { isAuthenticated, user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [docTitle, setDocTitle] = useState("");
  const [docTags, setDocTags] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [error, setError] = useState("");
  const [globalChatOpen, setGlobalChatOpen] = useState(false);

  const loadData = async () => {
    if (!isAuthenticated) {
      setDocuments([]);
      setStats(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [docs, userStats] = await Promise.all([
        api.documents.list(),
        api.analytics.getStats().catch(() => null),
      ]);
      setDocuments(docs || []);
      setStats(userStats);
    } catch (err) {
      if (err.message.includes("401") || err.message.includes("validate credentials")) {
        setDocuments([]);
        setStats(null);
      } else {
        setError(err.message || "Failed to load documents");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    } else {
      setDocuments([]);
      setStats(null);
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith(".pdf")) {
        setSelectedFile(file);
        setDocTitle(file.name.replace(/\.pdf$/i, ""));
      } else {
        setError("Please upload a PDF file only.");
      }
    }
  };

  const handleFileChange = (e) => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.toLowerCase().endsWith(".pdf")) {
        setSelectedFile(file);
        setDocTitle(file.name.replace(/\.pdf$/i, ""));
      } else {
        setError("Please upload a PDF file only.");
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    if (!selectedFile) return;

    setUploading(true);
    setError("");

    try {
      await api.documents.upload(selectedFile, docTitle, docTags);
      setSelectedFile(null);
      setDocTitle("");
      setDocTags("");
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to upload and parse PDF");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this document and all its study materials?")) return;

    try {
      await api.documents.delete(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      loadData();
    } catch (err) {
      alert(err.message || "Failed to delete document");
    }
  };

  // Collect all unique tags
  const allTags = ["All", ...new Set(documents.flatMap((d) => d.tags || []))];

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === "All" || (doc.tags && doc.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  // Guest Unauthenticated View
  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "var(--primary-glow)",
          color: "var(--primary)",
          padding: "6px 16px",
          borderRadius: "var(--radius-full)",
          fontSize: "0.85rem",
          fontWeight: "700",
          marginBottom: "20px",
          border: "1px solid var(--border-highlight)"
        }}>
          <Sparkles size={16} />
          <span>AI-Powered RAG Study Assistant</span>
        </div>

        <h1 style={{ fontSize: "2.8rem", maxWidth: "800px", margin: "0 auto 16px", lineHeight: "1.2" }}>
          Supercharge Your Learning with Intelligent PDF Study Spaces 🎓
        </h1>

        <p style={{ color: "var(--text-muted)", fontSize: "1.15rem", maxWidth: "680px", margin: "0 auto 36px" }}>
          Upload any lecture notes, textbook, or exam syllabus. StudyMate automatically chunks your PDFs, computes vector embeddings, and delivers answers with exact page citations, instant quizzes, and 3D flashcards.
        </p>

        <button
          onClick={onRequireAuth}
          className="btn-primary"
          style={{ padding: "14px 32px", fontSize: "1.05rem", borderRadius: "var(--radius-full)" }}
        >
          <LogIn size={20} />
          <span>Sign In / Sign Up to Get Started</span>
        </button>

        {/* Feature Highlights Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
          marginTop: "60px",
          textAlign: "left"
        }}>
          <div className="glass-panel" style={{ padding: "26px" }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "var(--primary-glow)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--primary)",
              marginBottom: "16px"
            }}>
              <BrainCircuit size={22} />
            </div>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>Grounded RAG Chat</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Ask questions and get answers synthesized directly from your PDF with clickable page citations.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: "26px" }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "rgba(168, 85, 247, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--secondary)",
              marginBottom: "16px"
            }}>
              <Award size={22} />
            </div>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>AI MCQ Practice Tests</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Generate exam-style quizzes with real-time scoring, instant explanations, and printable exam sheets.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: "26px" }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "rgba(16, 185, 129, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#10b981",
              marginBottom: "16px"
            }}>
              <Layers size={22} />
            </div>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>3D Active Recall Cards</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Master complex formulas, definitions, and concepts through interactive 3D flip card decks.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Dashboard View
  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 20px" }}>
      {/* Top Banner with Quick Actions */}
      <div style={{
        marginBottom: "32px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "20px"
      }}>
        <div style={{ maxWidth: "700px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "var(--primary-glow)",
            color: "var(--primary)",
            padding: "6px 14px",
            borderRadius: "var(--radius-full)",
            fontSize: "0.85rem",
            fontWeight: "700",
            marginBottom: "12px",
            border: "1px solid var(--border-highlight)"
          }}>
            <Sparkles size={16} />
            <span>AI-Powered Study Workspace</span>
          </div>
          <h1 style={{ fontSize: "2.4rem", letterSpacing: "-0.02em" }}>
            Welcome back, {user?.username || "Scholar"}! 📚
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", marginTop: "8px" }}>
            Upload PDFs, ask questions with page citations, generate instant quizzes, and search across your entire library.
          </p>
        </div>

        {/* Global Multi-Doc Chat Button */}
        <button
          onClick={() => setGlobalChatOpen(true)}
          className="btn-primary"
          style={{ padding: "12px 20px", fontSize: "0.95rem" }}
        >
          <Globe size={18} />
          <span>Ask Entire Library (Cross-Doc)</span>
        </button>
      </div>

      {/* Analytics Statistics Cards */}
      {stats && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "18px",
          marginBottom: "36px"
        }}>
          <div className="glass-panel" style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              width: "46px",
              height: "46px",
              borderRadius: "12px",
              background: "var(--primary-glow)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--primary)"
            }}>
              <BookOpen size={22} />
            </div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--text-main)" }}>{stats.total_documents}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>Documents Indexed</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              width: "46px",
              height: "46px",
              borderRadius: "12px",
              background: "rgba(168, 85, 247, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--secondary)"
            }}>
              <Sparkles size={22} />
            </div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--text-main)" }}>{stats.total_questions_asked}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>AI Questions Asked</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              width: "46px",
              height: "46px",
              borderRadius: "12px",
              background: "rgba(16, 185, 129, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#10b981"
            }}>
              <Award size={22} />
            </div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--text-main)" }}>{stats.total_quizzes_taken}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>Quizzes Completed</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              width: "46px",
              height: "46px",
              borderRadius: "12px",
              background: "rgba(245, 158, 11, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#f59e0b"
            }}>
              <Layers size={22} />
            </div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--text-main)" }}>{stats.total_flashcard_decks}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>Flashcard Decks</div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Section */}
      <div className="glass-panel" style={{ padding: "26px", marginBottom: "36px" }}>
        <h3 style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <UploadCloud size={22} color="var(--primary)" />
          <span>Upload Study Document (PDF)</span>
        </h3>

        {error && (
          <div style={{
            background: "rgba(244, 63, 94, 0.12)",
            border: "1px solid rgba(244, 63, 94, 0.25)",
            color: "#e11d48",
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            marginBottom: "16px",
            fontSize: "0.9rem"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleUpload}>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragActive ? "var(--primary)" : "var(--border-subtle)"}`,
              borderRadius: "var(--radius-lg)",
              padding: "36px 20px",
              textAlign: "center",
              background: dragActive ? "var(--primary-glow)" : "var(--bg-glass)",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onClick={() => document.getElementById("pdf-upload-input").click()}
          >
            <input
              id="pdf-upload-input"
              type="file"
              accept=".pdf"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <div style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              background: "var(--primary-glow)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "10px"
            }}>
              <UploadCloud size={26} color="var(--primary)" />
            </div>

            {selectedFile ? (
              <div>
                <p style={{ fontWeight: "700", color: "var(--text-main)", fontSize: "1.05rem" }}>
                  {selectedFile.name}
                </p>
                <p style={{ color: "var(--text-dim)", fontSize: "0.85rem", marginTop: "4px" }}>
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to process
                </p>
              </div>
            ) : (
              <div>
                <p style={{ fontWeight: "600", fontSize: "1rem", color: "var(--text-main)" }}>
                  Drag & Drop your PDF here, or <span style={{ color: "var(--primary)" }}>Browse</span>
                </p>
                <p style={{ color: "var(--text-dim)", fontSize: "0.85rem", marginTop: "4px" }}>
                  Supports textbook chapters, lecture notes, exam papers up to 15MB
                </p>
              </div>
            )}
          </div>

          {selectedFile && (
            <div style={{
              marginTop: "18px",
              display: "flex",
              flexWrap: "wrap",
              gap: "14px",
              alignItems: "center"
            }}>
              <div style={{ flex: "1 1 240px" }}>
                <input
                  type="text"
                  placeholder="Document Title (e.g. Chapter 4: Thermodynamics)"
                  className="input-field"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                />
              </div>

              <div style={{ flex: "1 1 200px" }}>
                <input
                  type="text"
                  placeholder="Subject Tags (e.g. Physics, Semester 2)"
                  className="input-field"
                  value={docTags}
                  onChange={(e) => setDocTags(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={uploading}
                style={{ padding: "12px 24px" }}
              >
                {uploading ? (
                  <>
                    <Clock className="animate-spin" size={18} />
                    <span>Extracting Text & Generating Vectors...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Process & Start Studying</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Documents Grid Header & Filters */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "16px",
        marginBottom: "20px"
      }}>
        <div>
          <h2>Your Study Library</h2>
          <p style={{ color: "var(--text-dim)", fontSize: "0.9rem" }}>
            {documents.length} {documents.length === 1 ? "document" : "documents"} indexed
          </p>
        </div>

        {/* Search Bar */}
        {documents.length > 0 && (
          <div style={{ position: "relative", minWidth: "260px" }}>
            <Search size={18} color="var(--text-dim)" style={{ position: "absolute", left: "14px", top: "12px" }} />
            <input
              type="text"
              placeholder="Search library..."
              className="input-field"
              style={{ paddingLeft: "40px", padding: "10px 14px 10px 40px", fontSize: "0.9rem" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Subject Tags Filter Pills */}
      {allTags.length > 1 && (
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "24px"
        }}>
          {allTags.map((tag, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedTag(tag)}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-full)",
                fontSize: "0.85rem",
                fontWeight: "600",
                background: selectedTag === tag ? "var(--primary)" : "var(--bg-glass)",
                color: selectedTag === tag ? "#fff" : "var(--text-muted)",
                border: selectedTag === tag ? "1px solid var(--primary)" : "1px solid var(--border-subtle)",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Documents List / Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
          <Clock size={32} style={{ animation: "spin 2s linear infinite", marginBottom: "12px" }} />
          <p>Loading your study library...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="glass-panel" style={{
          textAlign: "center",
          padding: "50px 20px",
          color: "var(--text-dim)"
        }}>
          <BookOpen size={48} color="var(--primary)" style={{ opacity: 0.5, marginBottom: "16px" }} />
          <h3>No study documents found</h3>
          <p style={{ marginTop: "6px", maxWidth: "450px", margin: "6px auto 0" }}>
            {searchQuery || selectedTag !== "All"
              ? "No documents matched your filters."
              : "Upload your first PDF above to start chatting with AI, generating quizzes, and reviewing flashcards!"}
          </p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "24px"
        }}>
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="glass-panel"
              onClick={() => onSelectDocument(doc)}
              style={{
                padding: "24px",
                cursor: "pointer",
                transition: "all 0.25s ease",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.borderColor = "var(--border-highlight)";
                e.currentTarget.style.boxShadow = "var(--card-shadow)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "var(--border-subtle)";
              }}
            >
              <div>
                <div style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: "14px"
                }}>
                  <div style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    background: "var(--primary-glow)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <FileText size={22} color="var(--primary)" />
                  </div>

                  <button
                    onClick={(e) => handleDelete(doc.id, e)}
                    className="btn-danger"
                    title="Delete document"
                    style={{ padding: "6px 10px" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <h3 style={{ fontSize: "1.2rem", marginBottom: "6px", color: "var(--text-main)" }}>
                  {doc.title}
                </h3>
                <p style={{ color: "var(--text-dim)", fontSize: "0.85rem", wordBreak: "break-all" }}>
                  {doc.filename}
                </p>

                {/* Tags Badges */}
                {doc.tags && doc.tags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
                    {doc.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        style={{
                          fontSize: "0.72rem",
                          background: "var(--bg-glass)",
                          color: "var(--primary)",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          border: "1px solid var(--border-subtle)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontWeight: "600"
                        }}
                      >
                        <Tag size={10} />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginTop: "20px" }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  marginBottom: "16px"
                }}>
                  <span style={{
                    background: "var(--bg-glass)",
                    padding: "3px 8px",
                    borderRadius: "var(--radius-full)",
                    border: "1px solid var(--border-subtle)"
                  }}>
                    📄 {doc.num_pages || 1} Pages
                  </span>
                  <span style={{
                    background: "var(--bg-glass)",
                    padding: "3px 8px",
                    borderRadius: "var(--radius-full)",
                    border: "1px solid var(--border-subtle)"
                  }}>
                    💾 {(doc.file_size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "14px",
                  borderTop: "1px solid var(--border-subtle)",
                  color: "var(--primary)",
                  fontWeight: "700",
                  fontSize: "0.95rem"
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <BrainCircuit size={16} />
                    Open Study Space
                  </span>
                  <ArrowRight size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Global Cross-Document Search Modal */}
      <GlobalChatModal
        isOpen={globalChatOpen}
        onClose={() => setGlobalChatOpen(false)}
        onSelectDocument={onSelectDocument}
      />
    </div>
  );
}
