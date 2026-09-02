import React, { useState, useEffect } from "react";
import {
  FileText, MessageSquare, Plus, Trash2, LayoutDashboard,
  ChevronRight, PanelLeftClose, PanelLeftOpen, Sparkles,
  BookOpen, Clock
} from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({
  isOpen,
  onToggle,
  selectedDocument,
  onSelectDocument,
  onGoHome,
  refreshTrigger,
}) {
  const { user, logout } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadSidebarData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [docs, chats] = await Promise.all([
        api.documents.list().catch(() => []),
        api.study.getRecentChats().catch(() => []),
      ]);
      setDocuments(docs || []);
      setRecentChats(chats || []);
    } catch (err) {
      console.error("Failed to load sidebar data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSidebarData();
  }, [user, refreshTrigger, selectedDocument]);

  const handleDeleteDoc = async (docId, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this document and all its study materials?")) return;
    try {
      await api.documents.delete(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      if (selectedDocument?.id === docId) {
        onGoHome();
      }
    } catch (err) {
      alert("Failed to delete document");
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="btn-secondary"
        style={{
          position: "fixed",
          top: "80px",
          left: "16px",
          zIndex: 40,
          padding: "8px",
          borderRadius: "10px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
        }}
        title="Open Sidebar"
      >
        <PanelLeftOpen size={20} color="var(--primary)" />
      </button>
    );
  }

  return (
    <aside
      className="glass-panel"
      style={{
        width: "290px",
        height: "calc(100vh - 75px)",
        position: "sticky",
        top: "75px",
        display: "flex",
        flexDirection: "column",
        borderRadius: "0 var(--radius-lg) var(--radius-lg) 0",
        borderLeft: "none",
        borderTop: "none",
        borderBottom: "none",
        background: "rgba(11, 15, 25, 0.92)",
        backdropFilter: "blur(20px)",
        zIndex: 40,
        flexShrink: 0,
        transition: "width 0.3s ease",
      }}
    >
      {/* Sidebar Header & Toggle */}
      <div style={{
        padding: "16px 18px",
        borderBottom: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <button
          onClick={onGoHome}
          style={{
            background: "none",
            color: !selectedDocument ? "var(--primary)" : "var(--text-main)",
            fontWeight: "700",
            fontSize: "0.95rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer"
          }}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard / Library</span>
        </button>

        <button
          onClick={onToggle}
          style={{
            background: "none",
            color: "var(--text-dim)",
            padding: "4px",
            borderRadius: "6px"
          }}
          title="Collapse Sidebar"
        >
          <PanelLeftClose size={18} />
        </button>
      </div>

      {/* New Study Space Action Button */}
      <div style={{ padding: "14px 18px" }}>
        <button
          onClick={onGoHome}
          className="btn-primary"
          style={{
            width: "100%",
            justifyContent: "center",
            padding: "10px",
            fontSize: "0.9rem"
          }}
        >
          <Plus size={18} />
          <span>Upload New PDF</span>
        </button>
      </div>

      {/* Scrollable Lists Area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 16px" }}>
        {/* Section 1: My Documents */}
        <div style={{ marginBottom: "22px" }}>
          <div style={{
            padding: "8px 8px 6px",
            fontSize: "0.75rem",
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--text-dim)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <span>My Documents ({documents.length})</span>
          </div>

          {documents.length === 0 ? (
            <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", padding: "8px" }}>
              No PDFs uploaded yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              {documents.map((doc) => {
                const isActive = selectedDocument?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => onSelectDocument(doc)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: "var(--radius-md)",
                      background: isActive ? "rgba(99, 102, 241, 0.2)" : "transparent",
                      border: isActive ? "1px solid var(--border-highlight)" : "1px solid transparent",
                      color: isActive ? "#fff" : "var(--text-muted)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.15s ease",
                      position: "relative"
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                      <FileText size={16} color={isActive ? "var(--primary)" : "var(--text-dim)"} style={{ flexShrink: 0 }} />
                      <span style={{
                        fontSize: "0.85rem",
                        fontWeight: isActive ? "600" : "400",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}>
                        {doc.title}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteDoc(doc.id, e)}
                      style={{
                        background: "none",
                        color: "var(--text-dim)",
                        padding: "4px",
                        borderRadius: "4px",
                        opacity: 0.6,
                        flexShrink: 0
                      }}
                      title="Delete"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#f43f5e";
                        e.currentTarget.style.opacity = "1";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--text-dim)";
                        e.currentTarget.style.opacity = "0.6";
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Recent Chat Conversations */}
        <div>
          <div style={{
            padding: "8px 8px 6px",
            fontSize: "0.75rem",
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--text-dim)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <span>Recent Q&A ({recentChats.length})</span>
          </div>

          {recentChats.length === 0 ? (
            <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", padding: "8px" }}>
              No chat history yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              {recentChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={async () => {
                    const doc = documents.find((d) => d.id === chat.document_id);
                    if (doc) {
                      onSelectDocument(doc);
                    } else {
                      try {
                        const fetchedDoc = await api.documents.get(chat.document_id);
                        onSelectDocument(fetchedDoc);
                      } catch {
                        alert("Document is no longer available.");
                      }
                    }
                  }}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "var(--radius-md)",
                    background: "transparent",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                    e.currentTarget.style.color = "var(--text-main)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-muted)";
                  }}
                >
                  <MessageSquare size={14} color="var(--primary)" style={{ flexShrink: 0, marginTop: "3px" }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{
                      fontSize: "0.82rem",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      margin: 0
                    }}>
                      {chat.question}
                    </p>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>
                      {chat.document_title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
