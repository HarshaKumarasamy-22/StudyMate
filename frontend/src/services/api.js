const API_BASE_URL = "/api/v1";

const getHeaders = (isMultipart = false) => {
  const token = localStorage.getItem("studymate_token");
  const headers = {};
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorDetail = "An unexpected error occurred.";
    try {
      const errorData = await response.json();
      errorDetail = errorData.detail || errorData.message || errorDetail;
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }
  return response.json();
};

export const api = {
  // --- Auth APIs ---
  auth: {
    signup: async (email, username, password) => {
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });
      return handleResponse(res);
    },
    login: async (email, password) => {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      return handleResponse(res);
    },
    getMe: async () => {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },

  // --- Document APIs ---
  documents: {
    list: async () => {
      const res = await fetch(`${API_BASE_URL}/documents/`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    get: async (id) => {
      const res = await fetch(`${API_BASE_URL}/documents/${id}`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    upload: async (file, title) => {
      const formData = new FormData();
      formData.append("file", file);
      if (title) {
        formData.append("title", title);
      }
      const res = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: "POST",
        headers: getHeaders(true),
        body: formData,
      });
      return handleResponse(res);
    },
    delete: async (id) => {
      const res = await fetch(`${API_BASE_URL}/documents/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },

  // --- AI Study APIs ---
  study: {
    // Chat
    chat: async (documentId, question) => {
      const res = await fetch(`${API_BASE_URL}/study/${documentId}/chat`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ question }),
      });
      return handleResponse(res);
    },
    getRecentChats: async () => {
      const res = await fetch(`${API_BASE_URL}/study/chats/recent`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    getChatHistory: async (documentId) => {

      const res = await fetch(`${API_BASE_URL}/study/${documentId}/chat/history`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    clearChatHistory: async (documentId) => {
      const res = await fetch(`${API_BASE_URL}/study/${documentId}/chat/history`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return handleResponse(res);
    },

    // Quiz
    generateQuiz: async (documentId, numQuestions = 5, difficulty = "medium") => {
      const res = await fetch(`${API_BASE_URL}/study/${documentId}/quiz/generate`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ num_questions: numQuestions, difficulty }),
      });
      return handleResponse(res);
    },
    listQuizzes: async (documentId) => {
      const res = await fetch(`${API_BASE_URL}/study/${documentId}/quizzes`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    getQuiz: async (quizId) => {
      const res = await fetch(`${API_BASE_URL}/study/quizzes/${quizId}`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    submitQuiz: async (quizId, answers) => {
      const res = await fetch(`${API_BASE_URL}/study/quizzes/${quizId}/submit`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ answers }),
      });
      return handleResponse(res);
    },

    // Flashcards
    generateFlashcards: async (documentId, numCards = 8) => {
      const res = await fetch(`${API_BASE_URL}/study/${documentId}/flashcards/generate`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ num_cards: numCards }),
      });
      return handleResponse(res);
    },
    listFlashcards: async (documentId) => {
      const res = await fetch(`${API_BASE_URL}/study/${documentId}/flashcards`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
    getFlashcardSet: async (flashcardId) => {
      const res = await fetch(`${API_BASE_URL}/study/flashcards/${flashcardId}`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },
};
