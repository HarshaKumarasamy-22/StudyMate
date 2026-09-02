import React, { useState, useEffect } from "react";
import { GraduationCap, LogOut, User, Sun, Moon } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ onOpenAuth, onGoHome, currentView }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem("studymate_theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("studymate_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <header style={{
      borderBottom: "1px solid var(--border-subtle)",
      background: "var(--bg-card)",
      backdropFilter: "blur(14px)",
      position: "sticky",
      top: 0,
      zIndex: 50,
      padding: "14px 24px"
    }}>
      <div style={{
        maxWidth: "1300px",
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        {/* Brand Logo */}
        <div 
          onClick={onGoHome}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            cursor: "pointer"
          }}
        >
          <div style={{
            background: "linear-gradient(135deg, #6366f1, #a855f7)",
            padding: "8px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)"
          }}>
            <GraduationCap size={24} color="#fff" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{
                fontFamily: "var(--font-heading)",
                fontSize: "1.35rem",
                fontWeight: "800",
                background: "linear-gradient(to right, var(--primary), var(--secondary))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>
                StudyMate
              </span>
              <span style={{
                fontSize: "0.7rem",
                background: "rgba(99, 102, 241, 0.2)",
                color: "var(--primary)",
                padding: "2px 8px",
                borderRadius: "12px",
                fontWeight: "600",
                border: "1px solid rgba(99, 102, 241, 0.3)"
              }}>
                AI RAG
              </span>
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-dim)", margin: 0 }}>
              Smart Study & Exam Prep Assistant
            </p>
          </div>
        </div>

        {/* User Navigation / Theme Toggle & Auth state */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="btn-secondary"
            style={{
              padding: "8px 12px",
              borderRadius: "var(--radius-full)",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? (
              <>
                <Sun size={16} color="#fbbf24" />
                <span style={{ fontSize: "0.8rem" }}>Light</span>
              </>
            ) : (
              <>
                <Moon size={16} color="#6366f1" />
                <span style={{ fontSize: "0.8rem" }}>Dark</span>
              </>
            )}
          </button>

          {isAuthenticated ? (
            <>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "var(--bg-glass)",
                padding: "6px 14px",
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--border-subtle)"
              }}>
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #6366f1, #ec4899)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: "0.85rem"
                }}>
                  {user?.username?.charAt(0).toUpperCase() || "U"}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)" }}>
                    {user?.username}
                  </span>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>
                    {user?.email}
                  </span>
                </div>
              </div>

              <button 
                onClick={logout} 
                className="btn-secondary" 
                style={{ padding: "8px 12px", fontSize: "0.85rem" }}
                title="Log out"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <button onClick={onOpenAuth} className="btn-primary">
              <User size={16} />
              <span>Sign In / Sign Up</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
