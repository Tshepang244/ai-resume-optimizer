"use client";

import { useRef, useState } from "react";
import { calculateATSScore } from "@/lib/atsScore";

type LoadingAction = "score" | "rewrite" | "upload" | null;

function bandFor(score: number) {
  if (score >= 80) {
    return { color: "var(--good)", soft: "var(--good-soft)", label: "Strong match" };
  }
  if (score >= 50) {
    return { color: "var(--mid)", soft: "var(--mid-soft)", label: "Needs work" };
  }
  return { color: "var(--low)", soft: "var(--low-soft)", label: "Weak match" };
}

function ScoreGauge({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const band = bandFor(score);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 120 120" className="h-36 w-36 -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="var(--line)"
            strokeWidth="10"
          />
          <circle
            className="gauge-ring"
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={band.color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-3xl font-semibold tabular-nums">
            {score}
          </span>
          <span className="text-[11px] uppercase tracking-wider text-[var(--ink-soft)]">
            / 100
          </span>
        </div>
      </div>
      <span
        className="rounded-full px-3 py-1 text-xs font-mono font-medium uppercase tracking-wide"
        style={{ color: band.color, backgroundColor: band.soft }}
      >
        {band.label}
      </span>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 15V4M12 4l-4 4M12 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ScanMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M2 8V3.5A1.5 1.5 0 013.5 2H8" stroke="var(--ink)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20 2h4.5A1.5 1.5 0 0126 3.5V8" stroke="var(--ink)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M26 20v4.5a1.5 1.5 0 01-1.5 1.5H20" stroke="var(--ink)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 26H3.5A1.5 1.5 0 012 24.5V20" stroke="var(--ink)" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="2" y1="14" x2="26" y2="14" stroke="var(--scan)" strokeWidth="2" />
    </svg>
  );
}

export default function Home() {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [aiFeedback, setAiFeedback] = useState("");
  const [rewrittenCV, setRewrittenCV] = useState("");
  const [loading, setLoading] = useState<LoadingAction>(null);
  const [dragActive, setDragActive] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCheck = async () => {
    if (!text.trim()) return;
    setLoading("score");

    try {
      const result = calculateATSScore(text);
      setScore(result);

      const res = await fetch("/api/ai-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: text, score: result }),
      });

      const data = await res.json();
      setAiFeedback(data.feedback || "No AI response");
    } catch (error) {
      setAiFeedback("AI error occurred");
    }

    setLoading(null);
  };

  const handleRewrite = async () => {
    if (!text.trim()) return;
    setLoading("rewrite");

    try {
      const res = await fetch("/api/ai-rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: text }),
      });

      const data = await res.json();
      setRewrittenCV(data.rewritten || "No rewrite generated");
    } catch (error) {
      setRewrittenCV("Rewrite failed");
    }

    setLoading(null);
  };

  const processFile = async (file: File) => {
    if (file.type !== "application/pdf") return;
    setFileName(file.name);

    const formData = new FormData();
    formData.append("file", file);
    setLoading("upload");

    try {
      const res = await fetch("/api/pdf-upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.text) setText(data.text);
    } catch (error) {
      console.error("PDF upload failed");
    }

    setLoading(null);
  };

  const handlePDFUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleClear = () => {
    setText("");
    setFileName(null);
    setScore(null);
    setAiFeedback("");
    setRewrittenCV("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCopy = async () => {
    if (!rewrittenCV) return;
    await navigator.clipboard.writeText(rewrittenCV);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownload = () => {
    if (!rewrittenCV) return;
    const blob = new Blob([rewrittenCV], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rewritten-resume.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasResults = score !== null || aiFeedback || rewrittenCV;
  const isBusy = loading !== null;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--line)] bg-[var(--paper-raised)]/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <ScanMark />
            <span className="font-mono text-sm font-semibold tracking-tight">
              ATS Resume AI
            </span>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full border border-[var(--line-strong)] px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-[var(--ink-soft)] sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--scan)]" />
            AI-Powered
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-14">
        {/* Hero */}
        <section className="mb-12 max-w-2xl">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[var(--scan)]">
            Resume Scanner
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            See your resume the way the robot reads it first.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[var(--ink-soft)]">
            Paste your resume or upload a PDF. Get an ATS match score, AI
            feedback on what&rsquo;s holding it back, and a rewritten version
            built to pass the filter.
          </p>
        </section>

        {/* Two-column workspace */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Input panel */}
          <div className="relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)] p-6 shadow-sm">
            {isBusy && <div className="scan-line" />}

            <h2 className="mb-4 font-mono text-xs uppercase tracking-wider text-[var(--ink-soft)]">
              01 — Your Resume
            </h2>

            {/* Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
                dragActive
                  ? "border-[var(--scan)] bg-[var(--scan-soft)]"
                  : "border-[var(--line-strong)] hover:border-[var(--scan)] hover:bg-[var(--scan-soft)]/40"
              }`}
            >
              <UploadIcon />
              {fileName ? (
                <div className="flex items-center gap-2 font-mono text-sm">
                  <span className="max-w-[220px] truncate">{fileName}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFileName(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-[var(--ink-soft)] hover:text-[var(--low)]"
                    aria-label="Remove file"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <p className="text-sm text-[var(--ink-soft)]">
                  Drag &amp; drop a PDF, or{" "}
                  <span className="font-medium text-[var(--scan)]">
                    click to browse
                  </span>
                </p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handlePDFUpload}
                className="hidden"
              />
            </div>

            <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-wider text-[var(--ink-soft)]">
              <span className="h-px flex-1 bg-[var(--line)]" />
              or paste text
              <span className="h-px flex-1 bg-[var(--line)]" />
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your resume text here..."
              className="h-56 w-full resize-none rounded-xl border border-[var(--line)] bg-transparent p-4 text-sm leading-relaxed outline-none transition-colors focus:border-[var(--scan)]"
            />

            <div className="mt-4 flex flex-wrap gap-2.5">
              <button
                onClick={handleCheck}
                disabled={!text.trim() || isBusy}
                className="rounded-lg bg-[var(--ink)] px-4 py-2.5 text-sm font-medium text-[var(--paper)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading === "score" ? "Scanning…" : "Check ATS Score"}
              </button>
              <button
                onClick={handleRewrite}
                disabled={!text.trim() || isBusy}
                className="rounded-lg border border-[var(--ink)] px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--ink)] hover:text-[var(--paper)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading === "rewrite" ? "Rewriting…" : "Rewrite CV (AI)"}
              </button>
              <button
                onClick={handleClear}
                disabled={isBusy}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-[var(--ink-soft)] transition-colors hover:text-[var(--low)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Results panel */}
          <div className="relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)] p-6 shadow-sm">
            <h2 className="mb-4 font-mono text-xs uppercase tracking-wider text-[var(--ink-soft)]">
              02 — Results
            </h2>

            {!hasResults && !isBusy && (
              <div className="flex h-[26rem] flex-col items-center justify-center gap-3 text-center text-[var(--ink-soft)]">
                <ScanMark />
                <p className="max-w-[220px] text-sm">
                  Run a scan to see your ATS score and AI feedback here.
                </p>
              </div>
            )}

            {isBusy && !hasResults && (
              <div className="flex h-[26rem] flex-col items-center justify-center gap-2 text-center text-[var(--ink-soft)]">
                <p className="font-mono text-sm">Scanning resume…</p>
              </div>
            )}

            {hasResults && (
              <div className="space-y-6">
                {score !== null && (
                  <div className="flex justify-center border-b border-[var(--line)] pb-6">
                    <ScoreGauge score={score} />
                  </div>
                )}

                {aiFeedback && (
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      AI Feedback
                    </h3>
                    <div className="rounded-xl border-l-2 border-[var(--scan)] bg-[var(--scan-soft)]/40 p-4">
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                        {aiFeedback}
                      </pre>
                    </div>
                  </div>
                )}

                {rewrittenCV && (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Rewritten CV</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={handleCopy}
                          className="font-mono text-xs text-[var(--ink-soft)] hover:text-[var(--scan)]"
                        >
                          {copied ? "Copied ✓" : "Copy"}
                        </button>
                        <span className="text-[var(--line-strong)]">|</span>
                        <button
                          onClick={handleDownload}
                          className="font-mono text-xs text-[var(--ink-soft)] hover:text-[var(--scan)]"
                        >
                          Download .txt
                        </button>
                      </div>
                    </div>
                    <div className="max-h-72 overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4">
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                        {rewrittenCV}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--line)] py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 text-xs text-[var(--ink-soft)] sm:flex-row">
          <span>Built by Tshepang</span>
          <a
            href="https://github.com/Tshepang244/ai-resume-optimizer"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--scan)]"
          >
            View source on GitHub →
          </a>
        </div>
      </footer>
    </div>
  );
}
