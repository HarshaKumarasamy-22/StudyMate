import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import AuthModal from "./components/AuthModal";
import Dashboard from "./components/Dashboard";
import StudyWorkspace from "./components/StudyWorkspace";

function MainApp() {
  const { isAuthenticated, user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Navigation */}
      <Navbar
        onOpenAuth={() => setAuthModalOpen(true)}
        onGoHome={() => setSelectedDocument(null)}
        currentView={selectedDocument ? "study" : "dashboard"}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {selectedDocument ? (
          <StudyWorkspace
            document={selectedDocument}
            onBack={() => setSelectedDocument(null)}
          />
        ) : (
          <Dashboard
            onSelectDocument={(doc) => {
              if (!isAuthenticated) {
                setAuthModalOpen(true);
              } else {
                setSelectedDocument(doc);
              }
            }}
            onRequireAuth={() => setAuthModalOpen(true)}
          />
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Footer */}
      <footer style={{
        padding: "24px",
        textAlign: "center",
        borderTop: "1px solid var(--border-subtle)",
        color: "var(--text-dim)",
        fontSize: "0.85rem",
        background: "rgba(11, 15, 25, 0.6)"
      }}>
        <p>StudyMate — AI Powered RAG Study Assistant • Built with FastAPI, PostgreSQL & React</p>
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
