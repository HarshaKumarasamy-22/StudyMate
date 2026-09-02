import React, { useState, useEffect } from "react";
import { Copy, Check, Sparkles, Volume2, VolumeX } from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";

export default function ChatMessageBubble({ msg, onPageClick }) {
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const isUser = msg.role === "user";

  useEffect(() => {
    return () => {
      if (isPlayingAudio && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isPlayingAudio]);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSpeech = () => {
    if (!window.speechSynthesis) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      window.speechSynthesis.cancel(); // Stop any other playing utterance
      // Strip markdown symbols for speech
      const cleanText = msg.content
        .replace(/[*#_`~[\]]/g, "")
        .replace(/https?:\/\/\S+/g, "");

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        width: "100%",
      }}
    >
      <div
        style={{
          maxWidth: isUser ? "85%" : "95%",
          padding: "14px 18px",
          borderRadius: "16px",
          background: isUser
            ? "linear-gradient(135deg, var(--primary), var(--secondary))"
            : "var(--bg-glass)",
          color: isUser ? "#ffffff" : "var(--text-main)",
          border: isUser ? "none" : "1px solid var(--border-subtle)",
          boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
          fontSize: "0.92rem",
          position: "relative",
        }}
      >
        {/* Assistant Header Toolbar */}
        {!isUser && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
              paddingBottom: "6px",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--primary)", fontWeight: "700", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <Sparkles size={14} />
              <span>StudyMate AI</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {/* Listen / Speech Button */}
              <button
                onClick={handleToggleSpeech}
                className="btn-secondary"
                style={{
                  padding: "4px 8px",
                  fontSize: "0.75rem",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  background: isPlayingAudio ? "var(--primary-glow)" : "var(--bg-card)",
                  borderColor: isPlayingAudio ? "var(--border-highlight)" : "var(--border-subtle)",
                  color: isPlayingAudio ? "var(--primary)" : "var(--text-main)",
                }}
                title={isPlayingAudio ? "Stop Audio" : "Listen to Answer (Text-to-Speech)"}
              >
                {isPlayingAudio ? <VolumeX size={13} color="var(--primary)" /> : <Volume2 size={13} />}
                <span>{isPlayingAudio ? "Stop" : "Listen"}</span>
              </button>

              {/* Copy Button */}
              <button
                onClick={handleCopy}
                className="btn-secondary"
                style={{
                  padding: "4px 8px",
                  fontSize: "0.75rem",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "var(--bg-card)",
                }}
                title="Copy answer text"
              >
                {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {isUser ? (
          <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}>{msg.content}</div>
        ) : (
          <MarkdownRenderer content={msg.content} />
        )}

        {/* Citations / Sources Badge */}
        {msg.sources && msg.sources.length > 0 && (
          <div
            style={{
              marginTop: "12px",
              paddingTop: "8px",
              borderTop: "1px solid var(--border-subtle)",
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "0.72rem", color: "var(--text-dim)", fontWeight: "600" }}>
              📍 Citations:
            </span>
            {msg.sources.map((s, sIdx) => (
              <button
                key={sIdx}
                onClick={() => onPageClick && onPageClick(s.page_number || 1)}
                title={`Click to jump to page ${s.page_number || 1} in PDF viewer`}
                style={{
                  background: "var(--primary-glow)",
                  color: "var(--primary)",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  fontSize: "0.72rem",
                  fontWeight: "700",
                  border: "1px solid var(--border-highlight)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <span>Page {s.page_number || "1"}</span>
                <span>↗</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
