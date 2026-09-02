import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownRenderer({ content }) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => <h3 style={{ fontSize: "1.2rem", margin: "12px 0 6px", fontWeight: "700" }} {...props} />,
          h2: ({ node, ...props }) => <h4 style={{ fontSize: "1.1rem", margin: "10px 0 6px", fontWeight: "700" }} {...props} />,
          h3: ({ node, ...props }) => <h5 style={{ fontSize: "1rem", margin: "8px 0 4px", fontWeight: "700" }} {...props} />,
          p: ({ node, ...props }) => <p style={{ margin: "6px 0", lineHeight: "1.65" }} {...props} />,
          ul: ({ node, ...props }) => <ul style={{ paddingLeft: "20px", margin: "6px 0", display: "flex", flexDirection: "column", gap: "4px" }} {...props} />,
          ol: ({ node, ...props }) => <ol style={{ paddingLeft: "20px", margin: "6px 0", display: "flex", flexDirection: "column", gap: "4px" }} {...props} />,
          li: ({ node, ...props }) => <li style={{ lineHeight: "1.6" }} {...props} />,
          strong: ({ node, ...props }) => <strong style={{ fontWeight: "700", color: "var(--primary)" }} {...props} />,
          code: ({ node, inline, ...props }) =>
            inline ? (
              <code
                style={{
                  background: "rgba(99, 102, 241, 0.12)",
                  color: "var(--primary)",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  fontSize: "0.85em",
                  fontFamily: "monospace",
                }}
                {...props}
              />
            ) : (
              <pre
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  overflowX: "auto",
                  margin: "10px 0",
                  fontSize: "0.88em",
                  fontFamily: "monospace",
                }}
              >
                <code {...props} />
              </pre>
            ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              style={{
                borderLeft: "3px solid var(--primary)",
                paddingLeft: "12px",
                margin: "8px 0",
                color: "var(--text-muted)",
                fontStyle: "italic",
              }}
              {...props}
            />
          ),
          table: ({ node, ...props }) => (
            <div style={{ overflowX: "auto", margin: "12px 0" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.88rem",
                }}
                {...props}
              />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th
              style={{
                borderBottom: "2px solid var(--border-subtle)",
                padding: "8px 12px",
                textAlign: "left",
                fontWeight: "700",
              }}
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td
              style={{
                borderBottom: "1px solid var(--border-subtle)",
                padding: "8px 12px",
              }}
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
