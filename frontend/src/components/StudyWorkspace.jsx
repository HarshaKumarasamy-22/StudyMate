import React, { useState, useEffect } from "react";
import {
  ArrowLeft, MessageSquare, HelpCircle, Layers, Sparkles, Send,
  RefreshCw, CheckCircle2, XCircle, ChevronLeft, ChevronRight,
  RotateCw, Award, BookOpen, FileText, Download, Printer, Copy,
  Check, ListFilter, Bookmark, Columns, Square
} from "lucide-react";
import confetti from "canvas-confetti";
import { api } from "../services/api";
import PdfViewer from "./PdfViewer";
import ChatMessageBubble from "./ChatMessageBubble";
import VoiceInputButton from "./VoiceInputButton";



export default function StudyWorkspace({ document, onBack }) {
  const [activeTab, setActiveTab] = useState("chat"); // 'chat' | 'summary' | 'quiz' | 'flashcards'
  const [splitView, setSplitView] = useState(true);
  const [targetPage, setTargetPage] = useState(1);

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

      // If citation exists, highlight first page in PDF
      if (res.sources && res.sources.length > 0 && res.sources[0].page_number) {
        setTargetPage(res.sources[0].page_number);
      }
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
    <div style={{ maxWidth: "1500px", margin: "0 auto", padding: "20px 20px" }}>
      {/* Top Header Bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "16px",
        marginBottom: "20px",
        paddingBottom: "16px",
        borderBottom: "1px solid var(--border-subtle)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <button onClick={onBack} className="btn-secondary" style={{ padding: "8px 12px" }}>
            <ArrowLeft size={18} />
            <span>Library</span>
          </button>
          <div>
            <h2 style={{ fontSize: "1.35rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <FileText size={20} color="var(--primary)" />
              {document.title}
            </h2>
            <p style={{ color: "var(--text-dim)", fontSize: "0.82rem" }}>
              {document.filename} • {document.num_pages || 1} Pages indexed
            </p>
          </div>
        </div>

        {/* Action Controls & Tab Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Side-by-Side Split View Toggle Button */}
          <button
            onClick={() => setSplitView(!splitView)}
            className="btn-secondary"
            style={{
              padding: "8px 12px",
              fontSize: "0.85rem",
              background: splitView ? "var(--primary-glow)" : "var(--bg-glass)",
              borderColor: splitView ? "var(--border-highlight)" : "var(--border-subtle)",
              color: splitView ? "var(--primary)" : "var(--text-main)",
            }}
            title={splitView ? "Switch to Single View" : "Switch to Side-by-Side PDF Reader"}
          >
            {splitView ? <Columns size={16} /> : <Square size={16} />}
            <span>{splitView ? "Split View: ON" : "Split View: OFF"}</span>
          </button>

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

      {/* Main Study Grid Layout (Side-by-Side or Single Column) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: splitView ? "1fr 1fr" : "1fr",
        gap: "20px",
        alignItems: "start"
      }}>
        {/* Left Column: Side-by-Side PDF Viewer */}
        {splitView && (
          <PdfViewer
            documentId={document.id}
            documentTitle={document.title}
            targetPage={targetPage}
          />
        )}

        {/* Right Column (or Full Width): AI Interactive Tools */}
        <div style={{ minWidth: 0 }}>
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
                padding: "14px 18px",
                borderBottom: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "var(--bg-card)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sparkles size={18} color="var(--primary)" />
                  <span style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                    AI Chat with Page Citations
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
                padding: "18px",
                display: "flex",
                flexDirection: "column",
                gap: "16px"
              }}>
                {messages.length === 0 ? (
                  <div style={{
                    textAlign: "center",
                    margin: "auto",
                    maxWidth: "460px",
                    color: "var(--text-dim)"
                  }}>
                    <div style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "50%",
                      background: "var(--primary-glow)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "14px"
                    }}>
                      <MessageSquare size={24} color="var(--primary)" />
                    </div>
                    <h3 style={{ fontSize: "1.15rem" }}>What would you like to learn today?</h3>
                    <p style={{ fontSize: "0.85rem", marginTop: "6px" }}>
                      Ask questions, request summaries, or clarify complex topics from this PDF.
                    </p>

                    {/* Prompt suggestions */}
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      marginTop: "16px",
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
                            padding: "9px 12px",
                            fontSize: "0.82rem",
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
                    <ChatMessageBubble
                      key={msg.id || idx}
                      msg={msg}
                      onPageClick={(pageNum) => {
                        setTargetPage(pageNum);
                        if (!splitView) setSplitView(true);
                      }}
                    />
                  ))
                )}


                {chatLoading && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-dim)" }}>
                    <Sparkles className="animate-spin" size={18} color="var(--primary)" />
                    <span style={{ fontSize: "0.85rem" }}>StudyMate is analyzing document context...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: "14px 18px",
                  background: "var(--bg-card)",
                  borderTop: "1px solid var(--border-subtle)",
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                }}
              >
                <VoiceInputButton
                  onTranscript={(spokenText) => {
                    setQuestion((prev) => (prev ? `${prev} ${spokenText}` : spokenText));
                  }}
                  disabled={chatLoading}
                />
                <input
                  type="text"
                  placeholder="Ask a question about this PDF (or click mic to speak)..."
                  className="input-field"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={chatLoading}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={chatLoading || !question.trim()}
                  style={{ padding: "0 18px", height: "46px" }}
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
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Summary Toolbar */}
              <div className="glass-panel" style={{
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px"
              }}>
                <div>
                  <h3 style={{ fontSize: "1.15rem" }}>AI Document Summary</h3>
                  <p style={{ color: "var(--text-dim)", fontSize: "0.82rem" }}>
                    Executive overview, key concepts, formulas, and takeaways
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {summary && (
                    <button onClick={handleCopySummary} className="btn-secondary" style={{ padding: "6px 12px", fontSize: "0.82rem" }}>
                      {copiedSummary ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                      <span>{copiedSummary ? "Copied" : "Copy"}</span>
                    </button>
                  )}

                  <button
                    onClick={handleGenerateSummary}
                    className="btn-primary"
                    disabled={summaryLoading}
                    style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                  >
                    {summaryLoading ? (
                      <>
                        <RefreshCw className="animate-spin" size={14} />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>{summary ? "Regenerate" : "Generate Summary"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Summary Content Cards */}
              {summaryLoading ? (
                <div className="glass-panel" style={{ textAlign: "center", padding: "50px 20px", color: "var(--text-dim)" }}>
                  <Sparkles className="animate-spin" size={28} color="var(--primary)" style={{ marginBottom: "12px" }} />
                  <h4>Synthesizing Document Summary...</h4>
                  <p style={{ fontSize: "0.85rem", marginTop: "4px" }}>Extracting key concepts, formulas, and takeaways</p>
                </div>
              ) : summary ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Executive Overview */}
                  <div className="glass-panel" style={{ padding: "20px" }}>
                    <h4 style={{ color: "var(--primary)", fontSize: "1rem", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Bookmark size={16} />
                      Executive Overview
                    </h4>
                    <p style={{ lineHeight: "1.7", fontSize: "0.92rem", color: "var(--text-main)", whiteSpace: "pre-wrap" }}>
                      {summary.executive_summary}
                    </p>
                  </div>

                  {/* Core Concepts */}
                  <div className="glass-panel" style={{ padding: "20px" }}>
                    <h4 style={{ color: "var(--secondary)", fontSize: "1rem", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Sparkles size={16} />
                      Core Concepts & Formulas
                    </h4>
                    <ul style={{ paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      {summary.key_concepts?.map((concept, cIdx) => (
                        <li key={cIdx} style={{ fontSize: "0.88rem", lineHeight: "1.5", color: "var(--text-main)" }}>
                          {concept}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* High-Yield Exam Takeaways */}
                  <div className="glass-panel" style={{ padding: "20px" }}>
                    <h4 style={{ color: "#10b981", fontSize: "1rem", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Award size={16} />
                      High-Yield Exam Takeaways
                    </h4>
                    <ul style={{ paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      {summary.takeaways?.map((takeaway, tIdx) => (
                        <li key={tIdx} style={{ fontSize: "0.88rem", lineHeight: "1.5", color: "var(--text-main)" }}>
                          {takeaway}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="glass-panel" style={{ textAlign: "center", padding: "50px 20px", color: "var(--text-dim)" }}>
                  <BookOpen size={40} color="var(--primary)" style={{ opacity: 0.5, marginBottom: "14px" }} />
                  <h4>One-Click AI Summary</h4>
                  <p style={{ marginTop: "4px", maxWidth: "380px", margin: "4px auto 0", fontSize: "0.85rem" }}>
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
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Quiz Generator Toolbar */}
              <div className="glass-panel" style={{
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px"
              }}>
                <div>
                  <h3 style={{ fontSize: "1.15rem" }}>AI Quiz Generator</h3>
                  <p style={{ color: "var(--text-dim)", fontSize: "0.82rem" }}>
                    Test your mastery with tailored practice questions
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  {activeQuiz && (
                    <button onClick={handlePrintQuiz} className="btn-secondary" style={{ padding: "6px 10px", fontSize: "0.8rem" }}>
                      <Printer size={14} />
                      <span>Print</span>
                    </button>
                  )}

                  <select
                    className="input-field"
                    style={{ width: "auto", padding: "6px 10px", fontSize: "0.82rem" }}
                    value={quizDifficulty}
                    onChange={(e) => setQuizDifficulty(e.target.value)}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>

                  <select
                    className="input-field"
                    style={{ width: "auto", padding: "6px 10px", fontSize: "0.82rem" }}
                    value={quizCount}
                    onChange={(e) => setQuizCount(Number(e.target.value))}
                  >
                    <option value={5}>5 Qs</option>
                    <option value={8}>8 Qs</option>
                    <option value={10}>10 Qs</option>
                  </select>

                  <button
                    onClick={handleGenerateQuiz}
                    className="btn-primary"
                    disabled={generatingQuiz}
                    style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                  >
                    {generatingQuiz ? (
                      <>
                        <RefreshCw className="animate-spin" size={14} />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Generate Quiz</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Active Quiz Player */}
              {activeQuiz ? (
                <div className="glass-panel" style={{ padding: "24px" }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                    paddingBottom: "14px",
                    borderBottom: "1px solid var(--border-subtle)"
                  }}>
                    <div>
                      <span style={{
                        fontSize: "0.75rem",
                        color: "var(--primary)",
                        fontWeight: "700",
                        textTransform: "uppercase"
                      }}>
                        Practice Test
                      </span>
                      <h3 style={{ fontSize: "1.3rem", marginTop: "2px" }}>
                        {activeQuiz.title}
                      </h3>
                    </div>

                    {quizResult && (
                      <div style={{
                        background: quizResult.score_percentage >= 70 ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                        color: quizResult.score_percentage >= 70 ? "#10b981" : "#f59e0b",
                        border: `1px solid ${quizResult.score_percentage >= 70 ? "#10b981" : "#f59e0b"}`,
                        padding: "6px 14px",
                        borderRadius: "var(--radius-full)",
                        fontWeight: "700",
                        fontSize: "0.95rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}>
                        <Award size={16} />
                        <span>Score: {quizResult.score_percentage}% ({quizResult.correct_count}/{quizResult.total_questions})</span>
                      </div>
                    )}
                  </div>

                  {/* Questions List */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
                    {activeQuiz.questions?.map((q, qIdx) => {
                      const reviewItem = quizResult?.review?.[qIdx];
                      return (
                        <div
                          key={qIdx}
                          style={{
                            background: "var(--bg-glass)",
                            padding: "18px",
                            borderRadius: "var(--radius-md)",
                            border: reviewItem
                              ? reviewItem.is_correct
                                ? "1px solid rgba(16, 185, 129, 0.5)"
                                : "1px solid rgba(244, 63, 94, 0.5)"
                              : "1px solid var(--border-subtle)"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "12px" }}>
                            <span style={{
                              background: "var(--bg-card)",
                              padding: "3px 8px",
                              borderRadius: "var(--radius-sm)",
                              fontWeight: "700",
                              fontSize: "0.8rem",
                              color: "var(--primary)"
                            }}>
                              Q{qIdx + 1}
                            </span>
                            <h4 style={{ fontSize: "0.98rem", fontWeight: "600", flex: 1, color: "var(--text-main)" }}>
                              {q.question}
                            </h4>
                          </div>

                          {/* Options Grid */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {q.options?.map((opt, optIdx) => {
                              const isSelected = quizAnswers[qIdx] === opt;
                              let optionBg = isSelected ? "var(--primary-glow)" : "var(--bg-card)";
                              let optionBorder = isSelected ? "var(--primary)" : "var(--border-subtle)";

                              if (quizResult) {
                                if (opt === q.answer) {
                                  optionBg = "rgba(16, 185, 129, 0.15)";
                                  optionBorder = "#10b981";
                                } else if (isSelected && !reviewItem?.is_correct) {
                                  optionBg = "rgba(244, 63, 94, 0.15)";
                                  optionBorder = "#f43f5e";
                                }
                              }

                              return (
                                <button
                                  key={optIdx}
                                  onClick={() => handleSelectQuizOption(qIdx, opt)}
                                  disabled={!!quizResult}
                                  style={{
                                    padding: "10px 14px",
                                    borderRadius: "var(--radius-md)",
                                    background: optionBg,
                                    border: `1px solid ${optionBorder}`,
                                    color: "var(--text-main)",
                                    textAlign: "left",
                                    fontSize: "0.9rem",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    transition: "all 0.15s ease"
                                  }}
                                >
                                  <span>{opt}</span>
                                  {quizResult && opt === q.answer && <CheckCircle2 size={16} color="#10b981" />}
                                  {quizResult && isSelected && !reviewItem?.is_correct && <XCircle size={16} color="#f43f5e" />}
                                </button>
                              );
                            })}
                          </div>

                          {/* Explanation box after submission */}
                          {reviewItem && (
                            <div style={{
                              marginTop: "12px",
                              padding: "10px 14px",
                              borderRadius: "var(--radius-sm)",
                              background: reviewItem.is_correct ? "rgba(16, 185, 129, 0.12)" : "rgba(244, 63, 94, 0.12)",
                              fontSize: "0.82rem",
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
                  <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                    {!quizResult ? (
                      <button
                        onClick={handleSubmitQuiz}
                        className="btn-primary"
                        disabled={quizSubmitting || Object.keys(quizAnswers).length === 0}
                        style={{ padding: "12px 24px" }}
                      >
                        {quizSubmitting ? "Scoring..." : "Submit Answers & Grade"}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setQuizResult(null);
                          setQuizAnswers({});
                        }}
                        className="btn-secondary"
                        style={{ padding: "10px 20px" }}
                      >
                        <RefreshCw size={14} />
                        <span>Retake Quiz</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="glass-panel" style={{ textAlign: "center", padding: "50px 20px" }}>
                  <HelpCircle size={40} color="var(--primary)" style={{ opacity: 0.5, marginBottom: "14px" }} />
                  <h4>No Quizzes Generated Yet</h4>
                  <p style={{ color: "var(--text-dim)", marginTop: "4px", maxWidth: "360px", margin: "4px auto 0", fontSize: "0.85rem" }}>
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
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Flashcard Generator Toolbar */}
              <div className="glass-panel" style={{
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px"
              }}>
                <div>
                  <h3 style={{ fontSize: "1.15rem" }}>AI Flashcard Decks</h3>
                  <p style={{ color: "var(--text-dim)", fontSize: "0.82rem" }}>
                    Active recall cards with 3D flip animation
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <select
                    className="input-field"
                    style={{ width: "auto", padding: "6px 10px", fontSize: "0.82rem" }}
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
                    style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                  >
                    {generatingCards ? (
                      <>
                        <RefreshCw className="animate-spin" size={14} />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
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
                  gap: "20px",
                  padding: "10px 0"
                }}>
                  {/* Progress & Title */}
                  <div style={{ textAlign: "center" }}>
                    <h4 style={{ fontSize: "1.15rem" }}>{activeSet.title}</h4>
                    <span style={{
                      color: "var(--text-dim)",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      marginTop: "2px",
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
                      maxWidth: "520px",
                      height: "320px",
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
                          fontSize: "0.72rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          color: "var(--primary)",
                          fontWeight: "700",
                          marginBottom: "12px"
                        }}>
                          Question / Key Concept
                        </span>
                        <h3 style={{ fontSize: "1.3rem", textAlign: "center", lineHeight: "1.4", color: "var(--text-main)" }}>
                          {activeSet.cards[currentCardIndex]?.front}
                        </h3>
                        <span style={{
                          marginTop: "auto",
                          fontSize: "0.78rem",
                          color: "var(--text-dim)",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}>
                          <RotateCw size={13} />
                          Click to reveal answer
                        </span>
                      </div>

                      {/* Back: Answer / Definition */}
                      <div className="flip-card-back glass-panel" style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--secondary)"
                      }}>
                        <span style={{
                          fontSize: "0.72rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          color: "var(--secondary)",
                          fontWeight: "700",
                          marginBottom: "12px"
                        }}>
                          Answer / Explanation
                        </span>
                        <p style={{ fontSize: "1.1rem", textAlign: "center", lineHeight: "1.5", color: "var(--text-main)" }}>
                          {activeSet.cards[currentCardIndex]?.back}
                        </p>
                        <span style={{
                          marginTop: "auto",
                          fontSize: "0.78rem",
                          color: "var(--text-dim)",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}>
                          <RotateCw size={13} />
                          Click to flip back
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Deck Navigation Controls */}
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <button
                      onClick={prevCard}
                      className="btn-secondary"
                      style={{ padding: "10px 14px", borderRadius: "50%" }}
                      title="Previous Card"
                    >
                      <ChevronLeft size={20} />
                    </button>

                    <button
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="btn-secondary"
                      style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                    >
                      <RotateCw size={14} />
                      <span>Flip Card</span>
                    </button>

                    <button
                      onClick={nextCard}
                      className="btn-primary"
                      style={{ padding: "10px 14px", borderRadius: "50%" }}
                      title="Next Card"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="glass-panel" style={{ textAlign: "center", padding: "50px 20px" }}>
                  <Layers size={40} color="var(--primary)" style={{ opacity: 0.5, marginBottom: "14px" }} />
                  <h4>No Flashcards Generated Yet</h4>
                  <p style={{ color: "var(--text-dim)", marginTop: "4px", maxWidth: "360px", margin: "4px auto 0", fontSize: "0.85rem" }}>
                    Click "Generate New Deck" above to create an interactive active recall deck!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
