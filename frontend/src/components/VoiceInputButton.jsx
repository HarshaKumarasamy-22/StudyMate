import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react";

export default function VoiceInputButton({ onTranscript, disabled }) {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }
      if (finalTranscript) {
        onTranscript(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onTranscript]);

  if (!supported) return null;

  const toggleListening = () => {
    if (disabled) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={toggleListening}
      disabled={disabled}
      className={isListening ? "btn-danger" : "btn-secondary"}
      style={{
        padding: "10px 12px",
        borderRadius: "var(--radius-md)",
        position: "relative",
        animation: isListening ? "pulse 1.5s infinite" : "none",
        boxShadow: isListening ? "0 0 14px rgba(244, 63, 94, 0.6)" : "none",
        transition: "all 0.2s ease",
      }}
      title={isListening ? "Listening... Click to stop" : "Speak your question (Voice Input)"}
    >
      {isListening ? (
        <MicOff size={18} color="#ffffff" />
      ) : (
        <Mic size={18} color="var(--primary)" />
      )}
    </button>
  );
}
