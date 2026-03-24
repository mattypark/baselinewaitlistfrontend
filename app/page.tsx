"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Typewriter config ────────────────────────────────────────────────────────
const FULL_TEXT = "baseline makes your future definite.";
const TYPE_SPEED = 60;
const DELETE_SPEED = 35;
const PAUSE_AFTER_TYPE = 2000;
const PAUSE_AFTER_DELETE = 2500;
const INITIAL_BLINK_PAUSE = 2500;

// ── Terminal boot sequence ───────────────────────────────────────────────────
const TERMINAL_LINES = [
  { text: "> processing request...", delay: 0, speed: 40 },
  { text: "$ cd /srv/baseline", delay: 600, speed: 30 },
  { text: "$ node init --waitlist", delay: 400, speed: 30 },
  { text: "  [██████████████████] 100%", delay: 300, speed: 18 },
  { text: "$ connecting to db...", delay: 500, speed: 35 },
  { text: "  ✓ connection established", delay: 700, speed: 25 },
  { text: "$ ./register --prompt", delay: 400, speed: 30 },
  { text: "  ready.", delay: 600, speed: 50 },
];

// ── Exit sequence ────────────────────────────────────────────────────────────
const EXIT_LINES = [
  { text: "^C", delay: 0, speed: 0 },
  { text: "^C", delay: 300, speed: 0 },
  { text: "", delay: 400, speed: 0 },
  { text: "> interrupt received. cancelling...", delay: 200, speed: 30 },
  { text: "$ kill -9 ./register", delay: 400, speed: 25 },
  { text: "  process terminated.", delay: 500, speed: 30 },
  { text: "$ cd /home", delay: 400, speed: 25 },
  { text: "  navigating to home...", delay: 300, speed: 30 },
  { text: "  done.", delay: 500, speed: 50 },
];

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Logo typewriter hook ─────────────────────────────────────────────────────
function useTypewriter(paused: boolean) {
  const [display, setDisplay] = useState("b");
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 530);
    return () => clearInterval(blinkInterval);
  }, []);

  useEffect(() => {
    if (paused) {
      setDisplay("b");
      return;
    }

    let timeout: ReturnType<typeof setTimeout>;
    let charIndex = 1;

    const typeNext = () => {
      if (charIndex < FULL_TEXT.length) {
        charIndex++;
        setDisplay(FULL_TEXT.slice(0, charIndex));
        timeout = setTimeout(typeNext, TYPE_SPEED);
      } else {
        timeout = setTimeout(deleteNext, PAUSE_AFTER_TYPE);
      }
    };

    const deleteNext = () => {
      if (charIndex > 1) {
        charIndex--;
        setDisplay(FULL_TEXT.slice(0, charIndex));
        timeout = setTimeout(deleteNext, DELETE_SPEED);
      } else {
        setDisplay("b");
        timeout = setTimeout(typeNext, PAUSE_AFTER_DELETE);
      }
    };

    timeout = setTimeout(typeNext, INITIAL_BLINK_PAUSE);

    return () => clearTimeout(timeout);
  }, [paused]);

  return { display, cursorVisible };
}

// ── Terminal sequence hook ───────────────────────────────────────────────────
function useTerminalSequence(active: boolean, key: number) {
  const [lines, setLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [emailCursorVisible, setEmailCursorVisible] = useState(true);

  useEffect(() => {
    if (!active) {
      setLines([]);
      setDone(false);
      return;
    }

    const blinkInterval = setInterval(() => {
      setEmailCursorVisible((v) => !v);
    }, 530);

    let cancelled = false;

    async function run() {
      for (let i = 0; i < TERMINAL_LINES.length; i++) {
        if (cancelled) return;
        const line = TERMINAL_LINES[i];
        await sleep(line.delay);
        if (cancelled) return;

        for (let c = 1; c <= line.text.length; c++) {
          if (cancelled) return;
          const partial = line.text.slice(0, c);
          setLines((prev) => {
            const next = [...prev];
            next[i] = partial;
            return next;
          });
          await sleep(line.speed);
        }
      }

      await sleep(800);
      if (!cancelled) setDone(true);
    }

    run();

    return () => {
      cancelled = true;
      clearInterval(blinkInterval);
    };
  }, [active, key]);

  return { lines, done, emailCursorVisible };
}

// ── Typed line sequence (used for exit) ──────────────────────────────────────
async function runLineSequence(
  linesDef: typeof EXIT_LINES,
  setLines: React.Dispatch<React.SetStateAction<string[]>>,
  cancelledRef: { current: boolean }
) {
  // Use a running count so instant and typed lines don't conflict
  let lineCount = 0;

  for (let i = 0; i < linesDef.length; i++) {
    if (cancelledRef.current) return;
    const line = linesDef[i];
    await sleep(line.delay);
    if (cancelledRef.current) return;

    const idx = lineCount;
    lineCount++;

    if (line.speed === 0 || line.text === "") {
      // Instant line
      setLines((prev) => [...prev, line.text]);
    } else {
      // Type character by character
      for (let c = 1; c <= line.text.length; c++) {
        if (cancelledRef.current) return;
        const partial = line.text.slice(0, c);
        setLines((prev) => {
          const next = [...prev];
          next[idx] = partial;
          return next;
        });
        await sleep(line.speed);
      }
    }
  }
}

// ── Main component ───────────────────────────────────────────────────────────
export default function HomePage() {
  const [mode, setMode] = useState<"home" | "terminal" | "email" | "usecase" | "exiting">("home");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [usecase, setUsecase] = useState("");
  const [usecaseSubmitted, setUsecaseSubmitted] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [ctrlCCount, setCtrlCCount] = useState(0);
  const [terminalKey, setTerminalKey] = useState(0);
  const [exitLines, setExitLines] = useState<string[]>([]);
  const ctrlCTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitCancelledRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const usecaseInputRef = useRef<HTMLInputElement>(null);

  const { display, cursorVisible } = useTypewriter(mode !== "home");
  const { lines: terminalLines, done, emailCursorVisible } = useTerminalSequence(
    mode === "terminal" || mode === "email" || mode === "usecase",
    terminalKey
  );

  // Reset everything and go home
  const resetToHome = useCallback(() => {
    setMode("home");
    setEmail("");
    setSubmitted(false);
    setPosition(null);
    setAlreadyExists(false);
    setUsecase("");
    setUsecaseSubmitted(false);
    setCtrlCCount(0);
    setExitLines([]);
    setTerminalKey((k) => k + 1);
  }, []);

  // Run exit sequence
  useEffect(() => {
    if (mode !== "exiting") {
      exitCancelledRef.current = true;
      return;
    }

    exitCancelledRef.current = false;
    setExitLines([]);

    async function run() {
      await runLineSequence(EXIT_LINES, setExitLines, exitCancelledRef);
      await sleep(600);
      if (!exitCancelledRef.current) {
        resetToHome();
      }
    }

    run();

    return () => {
      exitCancelledRef.current = true;
    };
  }, [mode, resetToHome]);

  // When terminal sequence finishes, switch to email mode
  useEffect(() => {
    if (done && mode === "terminal") {
      setMode("email");
    }
  }, [done, mode]);

  // Focus hidden input when email mode activates
  useEffect(() => {
    if (mode === "email" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode]);

  const handleWaitlistClick = () => {
    if (mode === "home") {
      setMode("terminal");
    }
  };

  const handleEmailSubmit = useCallback(async () => {
    if (!email.trim() || !email.includes("@") || submitting) return;
    setSubmitting(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${API_URL}/api/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setPosition(data.position);
      setAlreadyExists(data.alreadyExists);
      setSubmitted(true);
      // Transition to usecase question after a delay
      setTimeout(() => {
        setMode("usecase");
        setTimeout(() => usecaseInputRef.current?.focus(), 100);
      }, 2000);
    } catch {
      setSubmitted(true);
      setPosition(null);
      setTimeout(() => {
        setMode("usecase");
        setTimeout(() => usecaseInputRef.current?.focus(), 100);
      }, 2000);
    } finally {
      setSubmitting(false);
    }
  }, [email, submitting]);

  const handleUsecaseSubmit = useCallback(async () => {
    if (usecaseSubmitted) return;
    setUsecaseSubmitted(true);
    // Send usecase to backend if provided
    if (usecase.trim()) {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        await fetch(`${API_URL}/api/waitlist/usecase`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, usecase }),
        });
      } catch {
        // Silent fail — optional field
      }
    }
    // Go back home via exit animation
    setTimeout(() => setMode("exiting"), 1500);
  }, [email, usecase, usecaseSubmitted]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (mode === "email") handleEmailSubmit();
      else if (mode === "usecase") handleUsecaseSubmit();
    }
  };

  // Listen for Ctrl+C / Escape / Enter globally when in terminal/email/usecase mode
  useEffect(() => {
    if (mode !== "terminal" && mode !== "email" && mode !== "usecase") return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Escape exits immediately
      if (e.key === "Escape") {
        e.preventDefault();
        setTimeout(() => setMode("exiting"), 0);
        return;
      }

      // Enter submits email or usecase
      if (e.key === "Enter") {
        e.preventDefault();
        if (mode === "email") handleEmailSubmit();
        else if (mode === "usecase") handleUsecaseSubmit();
        return;
      }

      if (e.key === "c" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();

        setCtrlCCount((prev) => {
          const newCount = prev + 1;
          if (newCount >= 2) {
            setTimeout(() => setMode("exiting"), 0);
            return 0;
          }
          return newCount;
        });

        if (ctrlCTimerRef.current) clearTimeout(ctrlCTimerRef.current);
        ctrlCTimerRef.current = setTimeout(() => {
          setCtrlCCount(0);
        }, 1500);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [mode, handleEmailSubmit, handleUsecaseSubmit]);

  return (
    <div
      className="noise-overlay grid-bg grid-bg-animate"
      style={{
        height: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Coming 2026 — top center */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        style={{
          position: "absolute",
          top: 32,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: 16,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#dc143c",
          fontFamily: "var(--font-geist-mono)",
        }}
      >
        Summer 2026
      </motion.span>

      {/* ── HOME STATE ── */}
      <AnimatePresence mode="wait">
        {mode === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Typewriter text */}
            <div
              style={{
                fontSize: "clamp(18px, 4vw, 36px)",
                fontWeight: 400,
                fontFamily: "var(--font-geist-mono)",
                letterSpacing: "-0.02em",
                color: "#111",
                marginBottom: 48,
                minHeight: "1.4em",
                textAlign: "center",
                maxWidth: "90vw",
              }}
            >
              {display}
              <span
                style={{
                  display: "inline-block",
                  width: "0.65em",
                  height: "2px",
                  background: "#111",
                  verticalAlign: "baseline",
                  marginLeft: "2px",
                  marginBottom: "-0.15em",
                  opacity: cursorVisible ? 1 : 0,
                  transition: "opacity 0.08s",
                }}
              />
            </div>

            {/* >waitlist */}
            <button
              onClick={handleWaitlistClick}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              style={{
                fontSize: 14,
                fontFamily: "var(--font-geist-mono)",
                color: hovered ? "#dc143c" : "#111",
                background: "none",
                border: "none",
                cursor: "pointer",
                letterSpacing: "0.01em",
                position: "relative",
                display: "inline-block",
                padding: "4px 0",
                transition: "color 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              &gt;waitlist
              <span
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  height: 1,
                  background: "#dc143c",
                  transition: "width 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                  width: hovered ? "100%" : "0%",
                }}
              />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TERMINAL / EMAIL / USECASE STATE ── */}
      {(mode === "terminal" || mode === "email" || mode === "usecase") && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          onClick={() => {
            if (mode === "email") inputRef.current?.focus();
            if (mode === "usecase") usecaseInputRef.current?.focus();
          }}
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: 14,
            color: "#111",
            lineHeight: 1.9,
            width: "100%",
            maxWidth: 460,
            padding: "0 24px",
            position: "relative",
            zIndex: 1,
            cursor: mode === "email" || mode === "usecase" ? "text" : "default",
          }}
        >
          {/* Mobile X button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMode("exiting");
            }}
            className="mobile-exit-btn"
            style={{
              position: "absolute",
              top: -8,
              right: 16,
              width: 32,
              height: 32,
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "1px solid #ddd",
              borderRadius: 6,
              cursor: "pointer",
              color: "#999",
              fontSize: 16,
              fontFamily: "var(--font-geist-mono)",
              zIndex: 10,
            }}
            aria-label="Exit waitlist"
          >
            ✕
          </button>
          {terminalLines.map((line, i) => (
            <div
              key={i}
              style={{
                color: line.startsWith("  ✓") ? "#dc143c" : line.startsWith("  [") ? "#999" : "#111",
                whiteSpace: "pre",
              }}
            >
              {line}
            </div>
          ))}

          {mode === "email" && !submitted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              style={{
                marginTop: 16,
                position: "relative",
              }}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleEmailSubmit();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  position: "relative",
                }}
              >
                <span style={{ color: "#dc143c", whiteSpace: "pre", flexShrink: 0 }}>enter email: </span>
                <input
                  ref={inputRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  style={{
                    flex: 1,
                    background: "none",
                    border: "none",
                    outline: "none",
                    color: "#111",
                    fontSize: 14,
                    fontFamily: "var(--font-geist-mono)",
                    padding: 0,
                    caretColor: "#111",
                    minWidth: 0,
                  }}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!email.trim() || !email.includes("@") || submitting}
                  style={{
                    background: "none",
                    border: "1px solid",
                    borderColor: email.trim() && email.includes("@") ? "#dc143c" : "#ddd",
                    borderRadius: 4,
                    cursor: email.trim() && email.includes("@") ? "pointer" : "default",
                    color: email.trim() && email.includes("@") ? "#dc143c" : "#ccc",
                    fontSize: 14,
                    fontFamily: "var(--font-geist-mono)",
                    padding: "2px 8px",
                    marginLeft: 8,
                    flexShrink: 0,
                    transition: "all 0.2s ease",
                    opacity: submitting ? 0.5 : 1,
                  }}
                  aria-label="Submit email"
                >
                  ✓
                </button>
              </form>
              <div
                style={{
                  marginTop: 24,
                  fontSize: 12,
                  color: "#bbb",
                  whiteSpace: "normal",
                }}
              >
                {ctrlCCount === 1
                  ? "press ctrl+c again to exit"
                  : "press esc or ctrl+c twice to exit"}
              </div>
            </motion.div>
          )}

          {submitted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              style={{ marginTop: 16 }}
            >
              <div style={{ color: "#999" }}>$ validating {email}...</div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                style={{ color: "#dc143c" }}
              >
                {alreadyExists
                  ? "✓ you're already on the waitlist."
                  : "✓ added to waitlist. we'll be in touch."}
              </motion.div>
              {position !== null && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  style={{ color: "#999", marginTop: 8 }}
                >
                  position: #{position}
                </motion.div>
              )}
            </motion.div>
          )}

          {mode === "usecase" && !usecaseSubmitted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              style={{
                marginTop: 16,
                position: "relative",
              }}
            >
              <div style={{ color: "#111" }}>what will you use Baseline for?</div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUsecaseSubmit();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                <span style={{ color: "#dc143c", whiteSpace: "pre", flexShrink: 0 }}>&gt; </span>
                <input
                  ref={usecaseInputRef}
                  type="text"
                  value={usecase}
                  onChange={(e) => setUsecase(e.target.value)}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  style={{
                    flex: 1,
                    background: "none",
                    border: "none",
                    outline: "none",
                    color: "#dc143c",
                    fontSize: 14,
                    fontFamily: "var(--font-geist-mono)",
                    padding: 0,
                    caretColor: "#dc143c",
                    minWidth: 0,
                  }}
                  autoFocus
                />
                <button
                  type="submit"
                  style={{
                    background: "none",
                    border: "1px solid #dc143c",
                    borderRadius: 4,
                    cursor: "pointer",
                    color: "#dc143c",
                    fontSize: 14,
                    fontFamily: "var(--font-geist-mono)",
                    padding: "2px 8px",
                    marginLeft: 8,
                    flexShrink: 0,
                    transition: "all 0.2s ease",
                  }}
                  aria-label="Submit usecase"
                >
                  ✓
                </button>
              </form>
              <div
                style={{
                  marginTop: 24,
                  fontSize: 12,
                  color: "#bbb",
                  whiteSpace: "normal",
                }}
              >
                optional — press enter to skip
              </div>
            </motion.div>
          )}

          {usecaseSubmitted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              style={{ marginTop: 16 }}
            >
              {usecase.trim() ? (
                <div style={{ color: "#dc143c" }}>✓ noted. thanks for sharing.</div>
              ) : (
                <div style={{ color: "#999" }}>skipped.</div>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* ── EXITING STATE ── */}
      {mode === "exiting" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: 14,
            color: "#111",
            lineHeight: 1.9,
            width: "100%",
            maxWidth: 460,
            padding: "0 24px",
          }}
        >
          {exitLines.map((line, i) => (
            <div
              key={i}
              style={{
                color: line === "^C"
                  ? "#dc143c"
                  : line.includes("terminated") || line.includes("done.")
                    ? "#dc143c"
                    : line.includes("navigating") || line.includes("cancelling")
                      ? "#999"
                      : "#111",
                whiteSpace: "pre",
                fontWeight: line === "^C" ? 700 : 400,
              }}
            >
              {line}
            </div>
          ))}
        </motion.div>
      )}


      {/* Bottom strip */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 60,
          background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.03))",
          borderTop: "1px solid rgba(220,20,60,0.06)",
        }}
      />
    </div>
  );
}
