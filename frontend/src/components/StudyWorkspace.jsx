import React, { useState, useEffect } from "react";
import {
  ArrowLeft, MessageSquare, HelpCircle, Layers, Sparkles, Send,
  RefreshCw, CheckCircle2, XCircle, ChevronLeft, ChevronRight,
  RotateCw, Award, BookOpen, FileText, Download, Printer, Copy,
  Check, ListFilter, Bookmark
} from "lucide-react";
import confetti from "canvas-confetti";
import { api } from "../services/api";

export default function StudyWorkspace({ document, onBack }) {
  const [activeTab, setActiveTab] = useState("chat"); // 'chat' | 'summary' | 'quiz' | 'flashcards'

  // --- Chat State ---
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  // --- Summary State ---
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // --- Quiz State ---
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizDifficulty, setQuizDifficulty] = useState("medium");
  const [quizCount, setQuizCount] = useState(5);

  // --- Flashcard State ---
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [activeSet, setActiveSet] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [generatingCards, setGeneratingCards] = useState(false);
  const [cardCount, setCardCount] = useState(8);

  useEffect(() => {
    loadChatHistory();
    loadQuizzes();
    loadFlashcardSets();
    if (document.summary) {
      setSummary(document.summary);
    }
  }, [document.id]);

  const loadChatHistory = async () => {
    try {
      const history = await api.study.getChatHistory(document.id);
      setMessages(history);
    } catch (err) {
      console.error("Error loading chat history:", err);
    }
  };

  const loadQuizzes = async () => {
    try {
      const list = await api.study.listQuizzes(document.id);
      setQuizzes(list);
      if (list.length > 0 && !activeQuiz) {
        setActiveQuiz(list[0]);
      }
    } catch (err) {
      console.error("Error loading quizzes:", err);
    }
  };

  const loadFlashcardSets = async () => {
    try {
      const sets = await api.study.listFlashcards(document.id);
      setFlashcardSets(sets);
      if (sets.length > 0 && !activeSet) {
        setActiveSet(sets[0]);
      }
    } catch (err) {
      console.error("Error loading flashcards:", err);
    }
  };

  // --- Chat Handlers ---
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!question.trim() || chatLoading) return;

    const userQ = question.trim();
    setQuestion("");
    setChatError("");

    const tempUserMsg = {
      id: Date.now(),
      role: "user",
      content: userQ,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setChatLoading(true);

    try {
      const res = await api.study.chat(document.id, userQ);
      const assistantMsg = {
        id: Date.now() + 1,
        role: "assistant",
        content: res.answer,
        sources: res.sources,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setChatError(err.message || "Failed to get AI answer.");
    } finally {
      setChatLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm("Clear chat conversation for this document?")) return;
    try {
      await api.study.clearChatHistory(document.id);
      setMessages([]);
    } catch (err) {
      alert("Failed to clear chat history");
    }
  };

  // --- Summarization Handlers ---
  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await api.study.summarize(document.id);
      setSummary(res);
    } catch (err) {
      alert(err.message || "Failed to generate summary");
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleCopySummary = () => {
    if (!summary) return;
    const text = `# ${document.title} - AI Summary\n\n## Executive Summary\n${summary.executive_summary}\n\n## Key Concepts\n${summary.key_concepts?.map((c) => `- ${c}`).join("\n")}\n\n## High-Yield Takeaways\n${summary.takeaways?.map((t) => `- ${t}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleDownloadNotes = () => {
    const text = `# Study Notes: ${document.title}\n\nGenerated with StudyMate AI Assistant\nDate: ${new Date().toLocaleDateString()}\n\n---\n\n## 1. Executive Summary\n${summary?.executive_summary || "No summary generated yet."}\n\n## 2. Key Concepts & Formulas\n${summary?.key_concepts?.map((c) => `- ${c}`).join("\n") || "N/A"}\n\n## 3. High-Yield Exam Takeaways\n${summary?.takeaways?.map((t) => `- ${t}`).join("\n") || "N/A"}\n\n---\n\n## 4. Q&A Study History\n${messages.map((m) => `**${m.role === "user" ? "Q" : "A"}:** ${m.content}`).join("\n\n")}`;
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `${document.title.replace(/\s+/g, "_")}_Study_Notes.md`;
    link.click();
  };

  // --- Quiz Handlers ---
  const handleGenerateQuiz = async () => {
    setGeneratingQuiz(true);
    setQuizResult(null);
    setQuizAnswers({});
    try {
      const newQuiz = await api.study.generateQuiz(document.id, quizCount, quizDifficulty);
      setQuizzes((prev) => [newQuiz, ...prev]);
      setActiveQuiz(newQuiz);
    } catch (err) {
      alert(err.message || "Failed to generate quiz");
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleSelectQuizOption = (qIndex, option) => {
    if (quizResult) return;
    setQuizAnswers((prev) => ({
      ...prev,
      [qIndex]: option,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    setQuizSubmitting(true);
    try {
      const result = await api.study.submitQuiz(activeQuiz.id, quizAnswers);
      setQuizResult(result);
      if (result.score_percentage >= 70) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      alert(err.message || "Failed to submit quiz");
    } finally {
      setQuizSubmitting(false);
    }
  };

  const handlePrintQuiz = () => {
    window.print();
  };

  // --- Flashcard Handlers ---
  const handleGenerateFlashcards = async () => {
    setGeneratingCards(true);
    try {
      const newSet = await api.study.generateFlashcards(document.id, cardCount);
      setFlashcardSets((prev) => [newSet, ...prev]);
      setActiveSet(newSet);
      setCurrentCardIndex(0);
      setIsFlipped(false);
    } catch (err) {
      alert(err.message || "Failed to generate flashcards");
    } finally {
      setGeneratingCards(false);
    }
  };

  const nextCard = () => {
    if (!activeSet?.cards) return;
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev + 1) % activeSet.cards.length);
  };

  const prevCard = () => {
    if (!activeSet?.cards) return;
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev - 1 + activeSet.cards.length) % activeSet.cards.length);
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px 20px" }}>
      {/* Top Header Bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "16px",
        marginBottom: "24px",
        paddingBottom: "18px",
        borderBottom: "1px solid var(--border-subtle)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={onBack} className="btn-secondary" style={{ padding: "8px 12px" }}>
            <ArrowLeft size={18} />
            <span>Library</span>
          </button>
          <div>
            <h2 style={{ fontSize: "1.4rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <FileText size={20} color="var(--primary)" />
              {document.title}
            </h2>
            <p style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>
              {document.filename} • {document.num_pages || 1} Pages indexed
            </p>
          </div>
        </div>

        {/* Action Controls & Tab Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Download Notes Button */}
          <button
            onClick={handleDownloadNotes}
            className="btn-secondary"
            style={{ padding: "8px 12px", fontSize: "0.85rem" }}
            title="Download Study Notes as Markdown"
          >
            <Download size={16} />
            <span>Export Notes</span>
          </button>

          {/* Tab Navigation */}
          <div style={{
            display: "flex",
            background: "var(--bg-card)",
            padding: "4px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            gap: "4px"
          }}>
            <button
              onClick={() => setActiveTab("chat")}
              style={{
                padding: "8px 14px",
                borderRadius: "var(--radius-sm)",
                fontWeight: "600",
                fontSize: "0.85rem",
                background: activeTab === "chat" ? "var(--primary)" : "transparent",
                color: activeTab === "chat" ? "#fff" : "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <MessageSquare size={15} />
              <span>AI Chat</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("summary");
                if (!summary) handleGenerateSummary();
              }}
              style={{
                padding: "8px 14px",
                borderRadius: "var(--radius-sm)",
                fontWeight: "600",
                fontSize: "0.85rem",
                background: activeTab === "summary" ? "var(--primary)" : "transparent",
                color: activeTab === "summary" ? "#fff" : "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <BookOpen size={15} />
              <span>AI Summary</span>
            </button>

            <button
              onClick={() => setActiveTab("quiz")}
              style={{
                padding: "8px 14px",
                borderRadius: "var(--radius-sm)",
                fontWeight: "600",
                fontSize: "0.85rem",
                background: activeTab === "quiz" ? "var(--primary)" : "transparent",
                color: activeTab === "quiz" ? "#fff" : "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <HelpCircle size={15} />
              <span>MCQ Quiz</span>
            </button>

            <button
              onClick={() => setActiveTab("flashcards")}
              style={{
                padding: "8px 14px",
                borderRadius: "var(--radius-sm)",
                fontWeight: "600",
                fontSize: "0.85rem",
                background: activeTab === "flashcards" ? "var(--primary)" : "transparent",
                color: activeTab === "flashcards" ? "#fff" : "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Layers size={15} />
              <span>Flashcards</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 💬 TAB 1: AI STUDY CHAT                              */}
      {/* ==================================================== */}
      {activeTab === "chat" && (
        <div className="glass-panel" style={{
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 220px)",
          minHeight: "550px",
          overflow: "hidden"
        }}>
          {/* Chat Header */}
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg-card)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={18} color="var(--primary)" />
              <span style={{ fontWeight: "600", fontSize: "0.95rem" }}>
                Ask anything about this document (AI with Page Citations)
              </span>
            </div>
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                style={{
                  background: "none",
                  color: "var(--text-dim)",
                  fontSize: "0.8rem",
                  padding: "4px 8px"
                }}
              >
                Clear History
              </button>
            )}
          </div>

          {/* Messages Thread */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "18px"
          }}>
            {messages.length === 0 ? (
              <div style={{
                textAlign: "center",
                margin: "auto",
                maxWidth: "500px",
                color: "var(--text-dim)"
              }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "rgba(99, 102, 241, 0.12)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px"
                }}>
                  <MessageSquare size={26} color="var(--primary)" />
                </div>
                <h3>What would you like to learn today?</h3>
                <p style={{ fontSize: "0.9rem", marginTop: "8px" }}>
                  Ask questions, request summaries, or clarify complex topics from this PDF.
                </p>

                {/* Prompt suggestions */}
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  marginTop: "20px",
                  textAlign: "left"
                }}>
                  {[
                    "Give me a 3-bullet summary of this document",
                    "What are the most important formulas or concepts explained here?",
                    "Explain the core topic in simple terms with an example"
                  ].map((sampleQ, idx) => (
                    <button
                      key={idx}
                      onClick={() => setQuestion(sampleQ)}
                      className="btn-secondary"
                      style={{
                        padding: "10px 14px",
                        fontSize: "0.85rem",
                        justifyContent: "flex-start"
                      }}
                    >
                      💡 {sampleQ}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: msg.role === "user" ? "flex-end" : "flex-start"
                  }}
                >
                  <div style={{
                    maxWidth: "80%",
                    padding: "14px 18px",
                    borderRadius: "16px",
                    background: msg.role === "user"
                      ? "linear-gradient(135deg, var(--primary), #4f46e5)"
                      : "var(--bg-glass)",
                    color: msg.role === "user" ? "#fff" : "var(--text-main)",
                    border: msg.role === "assistant" ? "1px solid var(--border-subtle)" : "none",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
                    fontSize: "0.95rem",
                    lineHeight: "1.6",
                    whiteSpace: "pre-wrap"
                  }}>
                    {msg.content}

                    {/* Citations / Sources Badge */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div style={{
                        marginTop: "12px",
                        paddingTop: "10px",
                        borderTop: "1px solid var(--border-subtle)",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "6px",
                        alignItems: "center"
                      }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", fontWeight: "600" }}>
                          📍 Sources:
                        </span>
                        {msg.sources.map((s, sIdx) => (
                          <span
                            key={sIdx}
                            title={s.content}
                            style={{
                              background: "rgba(99, 102, 241, 0.2)",
                              color: "var(--primary)",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              border: "1px solid var(--border-highlight)"
                            }}
                          >
                            Page {s.page_number || "1"}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {chatLoading && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-dim)" }}>
                <Sparkles className="animate-spin" size={18} color="var(--primary)" />
                <span style={{ fontSize: "0.9rem" }}>StudyMate is analyzing document context...</span>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: "16px 20px",
              background: "var(--bg-card)",
              borderTop: "1px solid var(--border-subtle)",
              display: "flex",
              gap: "12px"
            }}
          >
            <input
              type="text"
              placeholder="Ask a question about this document..."
              className="input-field"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={chatLoading}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={chatLoading || !question.trim()}
              style={{ padding: "0 20px" }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* ==================================================== */}
      {/* 📄 TAB 2: ONE-CLICK AI SUMMARY                       */}
      {/* ==================================================== */}
      {activeTab === "summary" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Summary Toolbar */}
          <div className="glass-panel" style={{
            padding: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px"
          }}>
            <div>
              <h3>AI Document Summary</h3>
              <p style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>
                Executive overview, key concepts, formulas, and high-yield takeaways
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {summary && (
                <button onClick={handleCopySummary} className="btn-secondary" style={{ padding: "8px 14px" }}>
                  {copiedSummary ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                  <span>{copiedSummary ? "Copied" : "Copy Summary"}</span>
                </button>
              )}

              <button
                onClick={handleGenerateSummary}
                className="btn-primary"
                disabled={summaryLoading}
              >
                {summaryLoading ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    <span>Analyzing Document...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>{summary ? "Regenerate Summary" : "Generate Summary"}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Summary Content Cards */}
          {summaryLoading ? (
            <div className="glass-panel" style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-dim)" }}>
              <Sparkles className="animate-spin" size={32} color="var(--primary)" style={{ marginBottom: "12px" }} />
              <h3>Synthesizing Document Summary...</h3>
              <p style={{ fontSize: "0.9rem", marginTop: "6px" }}>Extracting key concepts, formulas, and takeaways</p>
            </div>
          ) : summary ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Executive Overview */}
              <div className="glass-panel" style={{ padding: "26px" }}>
                <h4 style={{ color: "var(--primary)", fontSize: "1.1rem", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Bookmark size={18} />
                  Executive Overview
                </h4>
                <p style={{ lineHeight: "1.75", fontSize: "0.98rem", color: "var(--text-main)", whiteSpace: "pre-wrap" }}>
                  {summary.executive_summary}
                </p>
              </div>

              {/* Two Column Grid: Concepts & Takeaways */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {/* Key Concepts */}
                <div className="glass-panel" style={{ padding: "24px" }}>
                  <h4 style={{ color: "#a855f7", fontSize: "1.05rem", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Sparkles size={18} />
                    Core Concepts & Formulas
                  </h4>
                  <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {summary.key_concepts?.map((concept, cIdx) => (
                      <li key={cIdx} style={{ fontSize: "0.92rem", lineHeight: "1.6", color: "var(--text-main)" }}>
                        {concept}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* High-Yield Exam Takeaways */}
                <div className="glass-panel" style={{ padding: "24px" }}>
                  <h4 style={{ color: "#10b981", fontSize: "1.05rem", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Award size={18} />
                    High-Yield Exam Takeaways
                  </h4>
                  <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {summary.takeaways?.map((takeaway, tIdx) => (
                      <li key={tIdx} style={{ fontSize: "0.92rem", lineHeight: "1.6", color: "var(--text-main)" }}>
                        {takeaway}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-dim)" }}>
              <BookOpen size={48} color="var(--primary)" style={{ opacity: 0.5, marginBottom: "16px" }} />
              <h3>One-Click AI Summary</h3>
              <p style={{ marginTop: "6px", maxWidth: "420px", margin: "6px auto 0" }}>
                Click "Generate Summary" above to get an instant academic executive summary of this entire PDF!
              </p>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 📝 TAB 3: INTERACTIVE MCQ QUIZ MODE                  */}
      {/* ==================================================== */}
      {activeTab === "quiz" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Quiz Generator Toolbar */}
          <div className="glass-panel" style={{
            padding: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px"
          }}>
            <div>
              <h3>AI Quiz Generator</h3>
              <p style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>
                Test your mastery with tailored multiple-choice questions
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {activeQuiz && (
                <button onClick={handlePrintQuiz} className="btn-secondary" style={{ padding: "8px 12px" }}>
                  <Printer size={16} />
                  <span>Print Quiz</span>
                </button>
              )}

              <select
                className="input-field"
                style={{ width: "auto", padding: "8px 12px" }}
                value={quizDifficulty}
                onChange={(e) => setQuizDifficulty(e.target.value)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>

              <select
                className="input-field"
                style={{ width: "auto", padding: "8px 12px" }}
                value={quizCount}
                onChange={(e) => setQuizCount(Number(e.target.value))}
              >
                <option value={5}>5 Questions</option>
                <option value={8}>8 Questions</option>
                <option value={10}>10 Questions</option>
              </select>

              <button
                onClick={handleGenerateQuiz}
                className="btn-primary"
                disabled={generatingQuiz}
              >
                {generatingQuiz ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate Quiz</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Active Quiz Player */}
          {activeQuiz ? (
            <div className="glass-panel" style={{ padding: "32px" }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
                paddingBottom: "16px",
                borderBottom: "1px solid var(--border-subtle)"
              }}>
                <div>
                  <span style={{
                    fontSize: "0.8rem",
                    color: "var(--primary)",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}>
                    Exam Readiness Test
                  </span>
                  <h2 style={{ fontSize: "1.5rem", marginTop: "4px" }}>
                    {activeQuiz.title}
                  </h2>
                </div>

                {quizResult && (
                  <div style={{
                    background: quizResult.score_percentage >= 70 ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                    color: quizResult.score_percentage >= 70 ? "#10b981" : "#f59e0b",
                    border: `1px solid ${quizResult.score_percentage >= 70 ? "#10b981" : "#f59e0b"}`,
                    padding: "8px 18px",
                    borderRadius: "var(--radius-full)",
                    fontWeight: "700",
                    fontSize: "1.1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <Award size={20} />
                    <span>Score: {quizResult.score_percentage}% ({quizResult.correct_count}/{quizResult.total_questions})</span>
                  </div>
                )}
              </div>

              {/* Questions List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                {activeQuiz.questions?.map((q, qIdx) => {
                  const reviewItem = quizResult?.review?.[qIdx];
                  return (
                    <div
                      key={qIdx}
                      style={{
                        background: "var(--bg-glass)",
                        padding: "24px",
                        borderRadius: "var(--radius-md)",
                        border: reviewItem
                          ? reviewItem.is_correct
                            ? "1px solid rgba(16, 185, 129, 0.5)"
                            : "1px solid rgba(244, 63, 94, 0.5)"
                          : "1px solid var(--border-subtle)"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "16px" }}>
                        <span style={{
                          background: "var(--bg-glass)",
                          padding: "4px 10px",
                          borderRadius: "var(--radius-sm)",
                          fontWeight: "700",
                          fontSize: "0.85rem",
                          color: "var(--primary)"
                        }}>
                          Q{qIdx + 1}
                        </span>
                        <h4 style={{ fontSize: "1.1rem", fontWeight: "600", flex: 1, color: "var(--text-main)" }}>
                          {q.question}
                        </h4>
                      </div>

                      {/* Options Grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        {q.options?.map((opt, optIdx) => {
                          const isSelected = quizAnswers[qIdx] === opt;
                          let optionBg = isSelected ? "rgba(99, 102, 241, 0.2)" : "var(--bg-card)";
                          let optionBorder = isSelected ? "var(--primary)" : "var(--border-subtle)";

                          if (quizResult) {
                            if (opt === q.answer) {
                              optionBg = "rgba(16, 185, 129, 0.2)";
                              optionBorder = "#10b981";
                            } else if (isSelected && !reviewItem?.is_correct) {
                              optionBg = "rgba(244, 63, 94, 0.2)";
                              optionBorder = "#f43f5e";
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleSelectQuizOption(qIdx, opt)}
                              disabled={!!quizResult}
                              style={{
                                padding: "14px 18px",
                                borderRadius: "var(--radius-md)",
                                background: optionBg,
                                border: `1px solid ${optionBorder}`,
                                color: "var(--text-main)",
                                textAlign: "left",
                                fontSize: "0.95rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                transition: "all 0.15s ease"
                              }}
                            >
                              <span>{opt}</span>
                              {quizResult && opt === q.answer && <CheckCircle2 size={18} color="#10b981" />}
                              {quizResult && isSelected && !reviewItem?.is_correct && <XCircle size={18} color="#f43f5e" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation box after submission */}
                      {reviewItem && (
                        <div style={{
                          marginTop: "16px",
                          padding: "12px 16px",
                          borderRadius: "var(--radius-sm)",
                          background: reviewItem.is_correct ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)",
                          fontSize: "0.85rem",
                          color: "var(--text-main)"
                        }}>
                          <strong>Explanation: </strong> {reviewItem.explanation || "No explanation provided."}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit / Retry Actions */}
              <div style={{ marginTop: "32px", display: "flex", justifyContent: "flex-end", gap: "16px" }}>
                {!quizResult ? (
                  <button
                    onClick={handleSubmitQuiz}
                    className="btn-primary"
                    disabled={quizSubmitting || Object.keys(quizAnswers).length === 0}
                    style={{ padding: "14px 32px", fontSize: "1rem" }}
                  >
                    {quizSubmitting ? "Scoring Quiz..." : "Submit Answers & Grade"}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setQuizResult(null);
                      setQuizAnswers({});
                    }}
                    className="btn-secondary"
                    style={{ padding: "12px 24px" }}
                  >
                    <RefreshCw size={16} />
                    <span>Retake This Quiz</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ textAlign: "center", padding: "60px 20px" }}>
              <HelpCircle size={48} color="var(--primary)" style={{ opacity: 0.5, marginBottom: "16px" }} />
              <h3>No Quizzes Generated Yet</h3>
              <p style={{ color: "var(--text-dim)", marginTop: "6px", maxWidth: "400px", margin: "6px auto 0" }}>
                Click "Generate Quiz" above to let AI create an instant MCQ practice test for you!
              </p>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 🎴 TAB 4: 3D FLASHCARDS DECK                         */}
      {/* ==================================================== */}
      {activeTab === "flashcards" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Flashcard Generator Toolbar */}
          <div className="glass-panel" style={{
            padding: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px"
          }}>
            <div>
              <h3>AI Flashcard Decks</h3>
              <p style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>
                Active recall cards with 3D flip animation for key concepts
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <select
                className="input-field"
                style={{ width: "auto", padding: "8px 12px" }}
                value={cardCount}
                onChange={(e) => setCardCount(Number(e.target.value))}
              >
                <option value={5}>5 Cards</option>
                <option value={8}>8 Cards</option>
                <option value={12}>12 Cards</option>
              </select>

              <button
                onClick={handleGenerateFlashcards}
                className="btn-primary"
                disabled={generatingCards}
              >
                {generatingCards ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    <span>Generating Cards...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate New Deck</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Flashcards Deck Player */}
          {activeSet && activeSet.cards?.length > 0 ? (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "24px",
              padding: "20px 0"
            }}>
              {/* Progress & Title */}
              <div style={{ textAlign: "center" }}>
                <h3 style={{ fontSize: "1.3rem" }}>{activeSet.title}</h3>
                <span style={{
                  color: "var(--text-dim)",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  marginTop: "4px",
                  display: "inline-block"
                }}>
                  Card {currentCardIndex + 1} of {activeSet.cards.length}
                </span>
              </div>

              {/* 3D Flip Card */}
              <div
                className={`flip-card ${isFlipped ? "flipped" : ""}`}
                style={{
                  width: "100%",
                  maxWidth: "600px",
                  height: "360px",
                  cursor: "pointer"
                }}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div className="flip-card-inner">
                  {/* Front: Question / Concept */}
                  <div className="flip-card-front glass-panel" style={{
                    border: "1px solid var(--border-highlight)"
                  }}>
                    <span style={{
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "var(--primary)",
                      fontWeight: "700",
                      marginBottom: "16px"
                    }}>
                      Question / Key Concept
                    </span>
                    <h2 style={{ fontSize: "1.5rem", textAlign: "center", lineHeight: "1.4", color: "var(--text-main)" }}>
                      {activeSet.cards[currentCardIndex]?.front}
                    </h2>
                    <span style={{
                      marginTop: "auto",
                      fontSize: "0.8rem",
                      color: "var(--text-dim)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}>
                      <RotateCw size={14} />
                      Click to reveal answer
                    </span>
                  </div>

                  {/* Back: Answer / Definition */}
                  <div className="flip-card-back glass-panel" style={{
                    background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15), var(--bg-card))",
                    border: "1px solid var(--secondary)"
                  }}>
                    <span style={{
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "var(--secondary)",
                      fontWeight: "700",
                      marginBottom: "16px"
                    }}>
                      Answer / Explanation
                    </span>
                    <p style={{ fontSize: "1.2rem", textAlign: "center", lineHeight: "1.5", color: "var(--text-main)" }}>
                      {activeSet.cards[currentCardIndex]?.back}
                    </p>
                    <span style={{
                      marginTop: "auto",
                      fontSize: "0.8rem",
                      color: "var(--text-dim)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}>
                      <RotateCw size={14} />
                      Click to flip back
                    </span>
                  </div>
                </div>
              </div>

              {/* Deck Navigation Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <button
                  onClick={prevCard}
                  className="btn-secondary"
                  style={{ padding: "12px 18px", borderRadius: "50%" }}
                  title="Previous Card"
                >
                  <ChevronLeft size={22} />
                </button>

                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="btn-secondary"
                  style={{ padding: "10px 20px" }}
                >
                  <RotateCw size={16} />
                  <span>Flip Card</span>
                </button>

                <button
                  onClick={nextCard}
                  className="btn-primary"
                  style={{ padding: "12px 18px", borderRadius: "50%" }}
                  title="Next Card"
                >
                  <ChevronRight size={22} />
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ textAlign: "center", padding: "60px 20px" }}>
              <Layers size={48} color="var(--primary)" style={{ opacity: 0.5, marginBottom: "16px" }} />
              <h3>No Flashcards Generated Yet</h3>
              <p style={{ color: "var(--text-dim)", marginTop: "6px", maxWidth: "400px", margin: "6px auto 0" }}>
                Click "Generate New Deck" above to create an interactive active recall deck!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
