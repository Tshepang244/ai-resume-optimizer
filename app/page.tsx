"use client";

import { useState } from "react";
import { calculateATSScore } from "@/lib/atsScore";

export default function Home() {
  const [text, setText] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [aiFeedback, setAiFeedback] = useState("");
  const [rewrittenCV, setRewrittenCV] = useState("");
  const [loading, setLoading] = useState(false);

  // 📊 ATS + AI Feedback
  const handleCheck = async () => {
    if (!text.trim()) return;

    setLoading(true);

    try {
      const result = calculateATSScore(text);
      setScore(result);

      const res = await fetch("/api/ai-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeText: text,
          score: result,
        }),
      });

      const data = await res.json();
      setAiFeedback(data.feedback || "No AI response");
    } catch (error) {
      setAiFeedback("AI error occurred");
    }

    setLoading(false);
  };

  // ✍️ Rewrite CV (AI)
  const handleRewrite = async () => {
    if (!text.trim()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/ai-rewrite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeText: text,
        }),
      });

      const data = await res.json();
      setRewrittenCV(data.rewritten || "No rewrite generated");
    } catch (error) {
      setRewrittenCV("Rewrite failed");
    }

    setLoading(false);
  };

  // 📄 PDF Upload
  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);

    try {
      const res = await fetch("/api/pdf-upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.text) {
        setText(data.text);
      }
    } catch (error) {
      console.error("PDF upload failed");
    }

    setLoading(false);
  };

  const handleClear = () => {
    setText("");
    setScore(null);
    setAiFeedback("");
    setRewrittenCV("");
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>ATS Resume AI Tool</h1>

      <p style={styles.subtitle}>
        Paste resume OR upload PDF → Get AI analysis + rewrite
      </p>

      {/* 📄 PDF Upload */}
      <input type="file" accept="application/pdf" onChange={handlePDFUpload} />

      {/* TEXT AREA */}
      <textarea
        style={styles.textarea}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste or upload resume..."
      />

      {/* BUTTONS */}
      <div style={styles.buttonRow}>
        <button style={styles.button} onClick={handleCheck}>
          {loading ? "Analyzing..." : "Check ATS Score"}
        </button>

        <button style={styles.button} onClick={handleRewrite}>
          Rewrite CV (AI)
        </button>

        <button style={styles.clearButton} onClick={handleClear}>
          Clear
        </button>
      </div>

      {/* SCORE */}
      {score !== null && (
        <div style={styles.resultBox}>
          <h2>ATS Score: {score}/100</h2>
        </div>
      )}

      {/* AI FEEDBACK */}
      {aiFeedback && (
        <div style={styles.feedbackBox}>
          <h3>AI Feedback</h3>
          <pre style={{ whiteSpace: "pre-wrap" }}>{aiFeedback}</pre>
        </div>
      )}

      {/* REWRITTEN CV */}
      {rewrittenCV && (
        <div style={styles.feedbackBox}>
          <h3>Rewritten CV</h3>
          <pre style={{ whiteSpace: "pre-wrap" }}>{rewrittenCV}</pre>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 40,
    maxWidth: 900,
    margin: "0 auto",
    fontFamily: "Arial",
  },
  title: {
    fontSize: 32,
    marginBottom: 10,
  },
  subtitle: {
    color: "#666",
    marginBottom: 20,
  },
  textarea: {
    width: "100%",
    height: 250,
    padding: 15,
    borderRadius: 8,
    border: "1px solid #ccc",
    fontSize: 14,
    marginTop: 10,
  },
  buttonRow: {
    display: "flex",
    gap: 10,
    marginTop: 15,
    flexWrap: "wrap",
  },
  button: {
    padding: "10px 15px",
    backgroundColor: "#111",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  clearButton: {
    padding: "10px 15px",
    backgroundColor: "#eee",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  resultBox: {
    marginTop: 20,
    padding: 15,
    border: "1px solid #ddd",
    borderRadius: 8,
    backgroundColor: "#fafafa",
  },
  feedbackBox: {
    marginTop: 20,
    padding: 15,
    border: "1px solid #ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
};