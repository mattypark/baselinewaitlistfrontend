"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Typewriter config ────────────────────────────────────────────────────────
const FULL_TEXT = "baseline is the next generation for info.";
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
    let charIndex = 0;

    const startTyping = () => {
      charIndex = 0;
      typeNext();
    };

    const typeNext = () => {
      if (charIndex < FULL_TEXT.length) {
        charIndex++;
        setDisplay(FULL_TEXT.slice(0, charIndex));
        timeout = setTimeout(typeNext, TYPE_SPEED);
      } else {
        timeout = setTimeout(startDeleting, PAUSE_AFTER_TYPE);
      }
    };

    const startDeleting = () => {
      deleteNext();
    };

    const deleteNext = () => {
      if (charIndex > 1) {
        charIndex--;
        setDisplay(FULL_TEXT.slice(0, charIndex));
        timeout = setTimeout(deleteNext, DELETE_SPEED);
      } else {
        setDisplay("b");
        timeout = setTimeout(startTyping, PAUSE_AFTER_DELETE);
      }
    };

    timeout = setTimeout(startTyping, INITIAL_BLINK_PAUSE);

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
  const [mode, setMode] = useState<"home" | "terminal" | "email" | "exiting">("home");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [ctrlCCount, setCtrlCCount] = useState(0);
  const [terminalKey, setTerminalKey] = useState(0);
  const [exitLines, setExitLines] = useState<string[]>([]);
  const ctrlCTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitCancelledRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { display, cursorVisible } = useTypewriter(mode !== "home");
  const { lines: terminalLines, done, emailCursorVisible } = useTerminalSequence(
    mode === "terminal" || mode === "email",
    terminalKey
  );

  // Reset everything and go home
  const resetToHome = useCallback(() => {
    setMode("home");
    setEmail("");
    setSubmitted(false);
    setPosition(null);
    setAlreadyExists(false);
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

  // Listen for Ctrl+C globally when in terminal/email mode
  useEffect(() => {
    if (mode !== "terminal" && mode !== "email") return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "c" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();

        setCtrlCCount((prev) => {
          const newCount = prev + 1;
          if (newCount >= 2) {
            // Use setTimeout to avoid state update during render
            setTimeout(() => setMode("exiting"), 0);
            return 0;
          }
          return newCount;
        });

        // Reset count after 1.5s if second Ctrl+C doesn't come
        if (ctrlCTimerRef.current) clearTimeout(ctrlCTimerRef.current);
        ctrlCTimerRef.current = setTimeout(() => {
          setCtrlCCount(0);
        }, 1500);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [mode]);

  const handleWaitlistClick = () => {
    if (mode === "home") {
      setMode("terminal");
    }
  };

  const handleEmailSubmit = async () => {
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
    } catch {
      setSubmitted(true);
      setPosition(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleEmailSubmit();
    }
  };

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
          color: "#999",
          fontFamily: "var(--font-geist-mono)",
        }}
      >
        Coming 2026
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
                fontSize: "clamp(32px, 5vw, 48px)",
                fontWeight: 400,
                fontFamily: "var(--font-geist-mono)",
                letterSpacing: "-0.02em",
                color: "#111",
                marginBottom: 48,
                minHeight: "1.4em",
                whiteSpace: "nowrap",
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
                color: "#111",
                background: "none",
                border: "none",
                cursor: "pointer",
                letterSpacing: "0.01em",
                position: "relative",
                display: "inline-block",
                padding: "4px 0",
              }}
            >
              &gt;waitlist
              <span
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  height: 1,
                  background: "#111",
                  transition: "width 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                  width: hovered ? "100%" : "0%",
                }}
              />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TERMINAL / EMAIL STATE ── */}
      {(mode === "terminal" || mode === "email") && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          onClick={() => mode === "email" && inputRef.current?.focus()}
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
            cursor: mode === "email" ? "text" : "default",
          }}
        >
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
                whiteSpace: "pre",
              }}
            >
              <span style={{ color: "#dc143c" }}>enter email: </span>
              <span>{email}</span>
              <span
                style={{
                  display: "inline-block",
                  width: "0.55em",
                  height: "2px",
                  background: "#111",
                  verticalAlign: "baseline",
                  marginLeft: "1px",
                  marginBottom: "-0.15em",
                  opacity: emailCursorVisible ? 1 : 0,
                  transition: "opacity 0.08s",
                }}
              />
              <input
                ref={inputRef}
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                style={{
                  position: "fixed",
                  top: -100,
                  left: -100,
                  width: 1,
                  height: 1,
                  opacity: 0.01,
                  border: "none",
                  padding: 0,
                  outline: "none",
                  caretColor: "transparent",
                }}
                autoFocus
              />
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
                  : "press ctrl+c twice to exit"}
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

      {/* Click anywhere to focus input in email mode */}
      {mode === "email" && !submitted && (
        <div
          onClick={() => inputRef.current?.focus()}
          style={{
            position: "fixed",
            inset: 0,
            cursor: "text",
            zIndex: 0,
          }}
        />
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
