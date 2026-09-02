import React, { useState, useEffect } from "react";
import { 
  FileText, ExternalLink, Download, Maximize2, 
  Minimize2, RefreshCw, ZoomIn, ZoomOut, AlertCircle 
} from "lucide-react";
import { api } from "../services/api";

export default function PdfViewer({ documentId, documentTitle, targetPage }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    let activeUrl = null;

    const fetchPdf = async () => {
      setLoading(true);
      setError("");
      try {
        const url = await api.documents.getPdfBlob(documentId);
        activeUrl = url;
        setPdfUrl(url);
      } catch (err) {
        setError(err.message || "Unable to display PDF document.");
      } finally {
        setLoading(false);
      }
    };

    fetchPdf();

    return () => {
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [documentId]);

  const pdfSrcWithPage = pdfUrl
    ? `${pdfUrl}#page=${targetPage || 1}&view=FitH`
    : "";

  return (
    <div
      className="glass-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        height: isFullscreen ? "100vh" : "calc(100vh - 220px)",
        minHeight: "550px",
        overflow: "hidden",
        position: isFullscreen ? "fixed" : "relative",
        inset: isFullscreen ? 0 : "auto",
        zIndex: isFullscreen ? 100 : 1,
        borderRadius: isFullscreen ? 0 : "var(--radius-lg)",
      }}
    >
      {/* Viewer Toolbar */}
      <div
        style={{
          padding: "12px 18px",
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-card)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          <FileText size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
          <span
            style={{
              fontWeight: "600",
              fontSize: "0.9rem",
              color: "var(--text-main)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {documentTitle}
          </span>
          {targetPage && (
            <span
              style={{
                fontSize: "0.75rem",
                background: "var(--primary-glow)",
                color: "var(--primary)",
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
                fontWeight: "700",
                border: "1px solid var(--border-highlight)",
              }}
            >
              Page {targetPage}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {pdfUrl && (
            <>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ padding: "6px 10px", fontSize: "0.8rem" }}
                title="Open in new browser tab"
              >
                <ExternalLink size={14} />
                <span>Pop Out</span>
              </a>

              <a
                href={pdfUrl}
                download={`${documentTitle}.pdf`}
                className="btn-secondary"
                style={{ padding: "6px 10px", fontSize: "0.8rem" }}
                title="Download original PDF"
              >
                <Download size={14} />
              </a>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="btn-secondary"
                style={{ padding: "6px 10px", fontSize: "0.8rem" }}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Viewer"}
              >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* PDF Content Area */}
      <div style={{ flex: 1, position: "relative", background: "var(--bg-secondary)" }}>
        {loading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "var(--text-dim)",
              gap: "12px",
            }}
          >
            <RefreshCw className="animate-spin" size={28} color="var(--primary)" />
            <p style={{ fontSize: "0.9rem" }}>Loading PDF document stream...</p>
          </div>
        ) : error ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#e11d48",
              padding: "20px",
              textAlign: "center",
              gap: "10px",
            }}
          >
            <AlertCircle size={32} />
            <p style={{ fontSize: "0.95rem", fontWeight: "600" }}>{error}</p>
          </div>
        ) : (
          <iframe
            key={pdfSrcWithPage}
            src={pdfSrcWithPage}
            title="PDF Document Viewer"
            style={{
              width: "100%",
              height: "100%",
              border: "none",
            }}
          />
        )}
      </div>
    </div>
  );
}
