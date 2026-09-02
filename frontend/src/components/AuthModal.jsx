import React, { useState } from "react";
import { X, Lock, Mail, User, AlertCircle, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AuthModal({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!username || username.length < 3) {
          throw new Error("Username must be at least 3 characters.");
        }
        await signup(email, username, password);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Authentication failed. Please check details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0, 0, 0, 0.75)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 100,
      padding: "20px"
    }}>
      <div className="glass-panel animate-fade-in" style={{
        maxWidth: "440px",
        width: "100%",
        padding: "32px",
        position: "relative",
        border: "1px solid var(--border-highlight)"
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "18px",
            right: "18px",
            background: "none",
            color: "var(--text-muted)",
            padding: "4px",
            borderRadius: "50%"
          }}
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, var(--primary), var(--secondary))",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "12px",
            boxShadow: "0 4px 16px var(--primary-glow)"
          }}>
            <Sparkles size={24} color="#fff" />
          </div>
          <h2>{isLogin ? "Welcome Back" : "Join StudyMate"}</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "6px" }}>
            {isLogin
              ? "Access your AI study materials and quizzes"
              : "Create an account to start studying with AI"}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            background: "rgba(244, 63, 94, 0.15)",
            border: "1px solid rgba(244, 63, 94, 0.3)",
            color: "#fb7185",
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            marginBottom: "20px",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {!isLogin && (
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                Username
              </label>
              <div style={{ position: "relative" }}>
                <User size={18} color="var(--text-dim)" style={{ position: "absolute", left: "14px", top: "14px" }} />
                <input
                  type="text"
                  placeholder="e.g. alex_student"
                  className="input-field"
                  style={{ paddingLeft: "42px" }}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={18} color="var(--text-dim)" style={{ position: "absolute", left: "14px", top: "14px" }} />
              <input
                type="email"
                placeholder="name@example.com"
                className="input-field"
                style={{ paddingLeft: "42px" }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={18} color="var(--text-dim)" style={{ position: "absolute", left: "14px", top: "14px" }} />
              <input
                type="password"
                placeholder="••••••••"
                className="input-field"
                style={{ paddingLeft: "42px" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: "100%", justifyContent: "center", padding: "12px", marginTop: "8px" }}
          >
            {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Toggle between Login and Signup */}
        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "0.9rem", color: "var(--text-muted)" }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            style={{
              background: "none",
              color: "var(--primary)",
              fontWeight: "600",
              textDecoration: "underline"
            }}
          >
            {isLogin ? "Sign Up" : "Log In"}
          </button>
        </div>
      </div>
    </div>
  );
}
