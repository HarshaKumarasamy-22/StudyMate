import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import AuthModal from "./components/AuthModal";
import Dashboard from "./components/Dashboard";
import StudyWorkspace from "./components/StudyWorkspace";

function MainApp() {
  const { isAuthenticated, user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDocumentChange = (doc) => {
    setSelectedDocument(doc);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleGoHome = () => {
    setSelectedDocument(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Navbar */}
      <Navbar
        onOpenAuth={() => setAuthModalOpen(true)}
        onGoHome={handleGoHome}
        currentView={selectedDocument ? "study" : "dashboard"}
      />

      {/* Main Workspace Layout (Sidebar + Content) */}
      <div style={{ flex: 1, display: "flex", position: "relative" }}>
        {/* Left Sidebar (visible when logged in) */}
        {isAuthenticated && (
          <Sidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            selectedDocument={selectedDocument}
            onSelectDocument={handleDocumentChange}
            onGoHome={handleGoHome}
            refreshTrigger={refreshTrigger}
          />
        )}

        {/* Center / Right Content Panel */}
        <main style={{ flex: 1, minWidth: 0, paddingBottom: "40px" }}>
          {selectedDocument ? (
            <StudyWorkspace
              document={selectedDocument}
              onBack={handleGoHome}
            />
          ) : (
            <Dashboard
              onSelectDocument={(doc) => {
                if (!isAuthenticated) {
                  setAuthModalOpen(true);
                } else {
                  handleDocumentChange(doc);
                }
              }}
              onRequireAuth={() => setAuthModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Footer */}
      <footer style={{
        padding: "20px",
        textAlign: "center",
        borderTop: "1px solid var(--border-subtle)",
        color: "var(--text-dim)",
        fontSize: "0.85rem",
        background: "rgba(11, 15, 25, 0.8)",
        zIndex: 10
      }}>
        <p>StudyMate — AI Powered RAG Study Assistant • Built with FastAPI, Supabase & React</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
