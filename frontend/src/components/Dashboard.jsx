import React, { useState, useEffect } from "react";
import { 
  UploadCloud, FileText, Trash2, ArrowRight, BookOpen, 
  Sparkles, CheckCircle, Clock, Search, BrainCircuit, HelpCircle
} from "lucide-react";
import { api } from "../services/api";

export default function Dashboard({ onSelectDocument, onRequireAuth }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [docTitle, setDocTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  const loadDocuments = async () => {
    setLoading(true);
    setError("");
    try {
      const docs = await api.documents.list();
      setDocuments(docs);
    } catch (err) {
      // If unauthorized, prompt login
      if (err.message.includes("401") || err.message.includes("validate credentials")) {
        onRequireAuth();
      } else {
        setError(err.message || "Failed to load documents");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
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
    if (!selectedFile) return;

    setUploading(true);
    setError("");

    try {
      await api.documents.upload(selectedFile, docTitle);
      setSelectedFile(null);
      setDocTitle("");
      await loadDocuments();
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
      setDocuments(documents.filter((d) => d.id !== docId));
    } catch (err) {
      alert(err.message || "Failed to delete document");
    }
  };

  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 20px" }}>
      {/* Top Banner */}
      <div style={{
        marginBottom: "36px",
        display: "flex",
        flexDirection: "column",
        gap: "12px"
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(99, 102, 241, 0.15)",
          color: "#a5b4fc",
          padding: "6px 14px",
          borderRadius: "var(--radius-full)",
          fontSize: "0.85rem",
          fontWeight: "600",
          alignSelf: "flex-start",
          border: "1px solid rgba(99, 102, 241, 0.25)"
        }}>
          <Sparkles size={16} />
          <span>AI-Powered Study Workspace</span>
        </div>
        <h1 style={{ fontSize: "2.5rem", letterSpacing: "-0.02em" }}>
          Transform Your Notes into Interactive Mastery 📚
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", maxWidth: "700px" }}>
          Upload textbooks, lecture slides, and notes. Ask AI questions with exact page citations,
          generate instant MCQ quizzes, and practice with smart flashcards.
        </p>
      </div>

      {/* Upload Section */}
      <div className="glass-panel" style={{ padding: "28px", marginBottom: "40px" }}>
        <h3 style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <UploadCloud size={22} color="var(--primary)" />
          <span>Upload Study Document (PDF)</span>
        </h3>

        {error && (
          <div style={{
            background: "rgba(244, 63, 94, 0.15)",
            border: "1px solid rgba(244, 63, 94, 0.3)",
            color: "#fb7185",
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
              padding: "40px 20px",
              textAlign: "center",
              background: dragActive ? "rgba(99, 102, 241, 0.08)" : "rgba(15, 23, 42, 0.4)",
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
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "rgba(99, 102, 241, 0.15)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "12px"
            }}>
              <UploadCloud size={28} color="var(--primary)" />
            </div>

            {selectedFile ? (
              <div>
                <p style={{ fontWeight: "600", color: "var(--text-main)", fontSize: "1.1rem" }}>
                  {selectedFile.name}
                </p>
                <p style={{ color: "var(--text-dim)", fontSize: "0.85rem", marginTop: "4px" }}>
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to process
                </p>
              </div>
            ) : (
              <div>
                <p style={{ fontWeight: "600", fontSize: "1.05rem" }}>
                  Drag & Drop your PDF here, or <span style={{ color: "var(--primary)" }}>Browse</span>
                </p>
                <p style={{ color: "var(--text-dim)", fontSize: "0.85rem", marginTop: "6px" }}>
                  Supports textbook chapters, research papers, course notes up to 15MB
                </p>
              </div>
            )}
          </div>

          {selectedFile && (
            <div style={{
              marginTop: "20px",
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
              alignItems: "center"
            }}>
              <div style={{ flex: "1 1 300px" }}>
                <input
                  type="text"
                  placeholder="Document Title (e.g. Chapter 4: Photosynthesis)"
                  className="input-field"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
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

      {/* Documents Grid Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "16px",
        marginBottom: "24px"
      }}>
        <div>
          <h2>Your Study Library</h2>
          <p style={{ color: "var(--text-dim)", fontSize: "0.9rem" }}>
            {documents.length} {documents.length === 1 ? "document" : "documents"} indexed and ready for AI recall
          </p>
        </div>

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

      {/* Documents List / Cards */}
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
            {searchQuery
              ? "No documents matched your search query."
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
                position: "relative",
                overflow: "hidden"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.borderColor = "var(--border-highlight)";
                e.currentTarget.style.boxShadow = "0 12px 30px -8px var(--primary-glow)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.boxShadow = "0 10px 30px -10px rgba(0,0,0,0.5)";
              }}
            >
              <div>
                <div style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: "16px"
                }}>
                  <div style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    background: "rgba(99, 102, 241, 0.15)",
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

                <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>
                  {doc.title}
                </h3>
                <p style={{ color: "var(--text-dim)", fontSize: "0.85rem", wordBreak: "break-all" }}>
                  {doc.filename}
                </p>
              </div>

              <div style={{ marginTop: "20px" }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  marginBottom: "16px"
                }}>
                  <span style={{
                    background: "var(--bg-glass)",
                    padding: "4px 10px",
                    borderRadius: "var(--radius-full)",
                    border: "1px solid var(--border-subtle)"
                  }}>
                    📄 {doc.num_pages || 1} Pages
                  </span>
                  <span style={{
                    background: "var(--bg-glass)",
                    padding: "4px 10px",
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
                  fontWeight: "600",
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
    </div>
  );
}
