"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";

// ── Animated graph data ──────────────────────────────────────────────────────
const GRAPH_POINTS = [
  { x: 0, y: 72 }, { x: 15, y: 65 }, { x: 30, y: 70 }, { x: 45, y: 48 },
  { x: 60, y: 55 }, { x: 75, y: 38 }, { x: 90, y: 42 }, { x: 105, y: 28 },
  { x: 120, y: 35 }, { x: 135, y: 22 }, { x: 150, y: 30 }, { x: 165, y: 15 },
  { x: 180, y: 20 }, { x: 195, y: 10 }, { x: 210, y: 18 }, { x: 225, y: 8 },
];

const GRAPH2_POINTS = [
  { x: 0, y: 85 }, { x: 18, y: 78 }, { x: 36, y: 82 }, { x: 54, y: 60 },
  { x: 72, y: 65 }, { x: 90, y: 45 }, { x: 108, y: 50 }, { x: 126, y: 35 },
  { x: 144, y: 40 }, { x: 162, y: 25 }, { x: 180, y: 32 }, { x: 198, y: 18 },
  { x: 216, y: 22 }, { x: 234, y: 12 },
];

const BAR_DATA = [
  { label: "Mon", value: 45 }, { label: "Tue", value: 72 },
  { label: "Wed", value: 58 }, { label: "Thu", value: 85 },
  { label: "Fri", value: 67 }, { label: "Sat", value: 92 },
  { label: "Sun", value: 78 },
];

const METRICS = [
  { label: "Active Users", value: "12,847", change: "+14.2%", up: true },
  { label: "Conversion", value: "3.42%", change: "+0.8%", up: true },
  { label: "Avg. Session", value: "4m 32s", change: "+22s", up: true },
  { label: "Bounce Rate", value: "28.1%", change: "-3.4%", up: false },
];

function pointsToPath(pts: { x: number; y: number }[]): string {
  return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
}

function pointsToArea(pts: { x: number; y: number }[], height: number): string {
  const line = pointsToPath(pts);
  const last = pts[pts.length - 1];
  const first = pts[0];
  return `${line} L${last.x},${height} L${first.x},${height} Z`;
}

// ── Spacing constants ────────────────────────────────────────────────────────
// Consistent vertical rhythm: 120px between major sections, 80px for sub-sections
const SECTION_GAP = 120;      // px between major page sections
const SUBSECTION_GAP = 80;    // px between sub-sections within a section
const CARD_GAP = 20;          // px between dashboard cards
const CARD_PADDING = 28;      // px inside cards

// ── Live ticker numbers ─────────────────────────────────────────────────────
function AnimatedCounter({ target, duration = 2000 }: { target: string; duration?: number }) {
  const [display, setDisplay] = useState("0");
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;
    const numeric = parseFloat(target.replace(/[^0-9.]/g, ""));
    const suffix = target.replace(/[0-9.,]/g, "");
    const hasComma = target.includes(",");
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = numeric * eased;

      if (hasComma) {
        setDisplay(Math.floor(current).toLocaleString() + suffix);
      } else if (target.includes(".")) {
        const decimals = target.split(".")[1]?.replace(/[^0-9]/g, "").length || 0;
        setDisplay(current.toFixed(decimals) + suffix);
      } else {
        setDisplay(Math.floor(current).toLocaleString() + suffix);
      }

      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, target, duration]);

  return <span ref={ref}>{display}</span>;
}

// ── Mini sparkline ──────────────────────────────────────────────────────────
function Sparkline({ data, color = "#000" }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 110;
  const h = 36;
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * h,
  }));
  const path = pointsToPath(points);

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <path d={path} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="2" fill={color} />
    </svg>
  );
}

// ── Reusable section container ──────────────────────────────────────────────
function SectionContainer({ children, className = "", maxWidth = 1140 }: { children: React.ReactNode; className?: string; maxWidth?: number }) {
  return (
    <div className={className} style={{ width: "100%", maxWidth, marginLeft: "auto", marginRight: "auto" }}>
      {children}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [spotNumber, setSpotNumber] = useState(0);
  const graphRef = useRef<HTMLDivElement>(null);
  const graphInView = useInView(graphRef, { once: true, margin: "-80px" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;
    setSpotNumber(Math.floor(Math.random() * 200) + 847);
    setSubmitted(true);
  };

  return (
    <div className="noise-overlay grid-bg grid-bg-animate" style={{ minHeight: "100vh", overflow: "visible", width: "100%" }}>
      <div className="relative" style={{ minHeight: "100vh", width: "100%", maxWidth: 1400, margin: "0 auto", padding: "0 clamp(24px, 4vw, 64px)" }}>

        {/* ── Nav ─────────────────────────────────────────── */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between py-5"
          style={{
            background: "transparent",
            paddingLeft: "clamp(24px, 4vw, 64px)",
            paddingRight: "clamp(24px, 4vw, 64px)",
            marginTop: 15,
            marginLeft: 5,
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 relative">
              <div className="absolute inset-0 bg-black rounded-md" />
              <div className="absolute top-[6px] left-[6px] w-[7px] h-[1.5px] bg-white rounded-full" />
              <div className="absolute top-[11px] left-[6px] w-[12px] h-[1.5px] bg-white rounded-full" />
              <div className="absolute top-[16px] left-[6px] w-[9px] h-[1.5px] bg-white rounded-full" />
            </div>
            <span
              className="text-[15px] font-medium tracking-[-0.02em]"
              style={{ fontFamily: "var(--font-geist-sans)" }}
            >
              Baseline
            </span>
          </div>
          <div className="flex items-center gap-6">
            <span
              className="hidden sm:block text-[13px] tracking-wide uppercase"
              style={{ color: "#999", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.08em" }}
            >
              Coming 2026
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[12px]" style={{ color: "#666", fontFamily: "var(--font-geist-mono)" }}>
                Building
              </span>
            </div>
          </div>
        </motion.nav>

        {/* ── Hero ────────────────────────────────────────── */}
        <section className="relative flex items-center justify-center w-full" style={{ minHeight: "100vh", paddingTop: 80, paddingBottom: 80 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: 780 }}>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex items-center justify-center gap-3"
              style={{ marginBottom: 40 }}
            >
              <div className="h-[1px] w-8 bg-black/20" />
              <span
                className="text-[11px] uppercase tracking-[0.15em]"
                style={{ color: "#999", fontFamily: "var(--font-geist-mono)" }}
              >
                Analytics, reimagined
              </span>
              <div className="h-[1px] w-8 bg-black/20" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-[clamp(2.5rem,6vw,4.2rem)] font-medium leading-[1.08] tracking-[-0.035em] text-center"
              style={{ fontFamily: "var(--font-geist-sans)", marginBottom: 32 }}
            >
              Know your
              <br />
              numbers.{" "}
              <span style={{ color: "#bbb" }}>
                Own
                <br />
                your growth.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.6 }}
              className="text-[16px] sm:text-[17px] leading-[1.7] text-center"
              style={{ color: "#666", maxWidth: 520, marginBottom: 48 }}
            >
              Baseline gives you a single, clear view of every metric that matters —
              no noise, no dashboards you&apos;ll never open. Just signal.
            </motion.p>

            {/* CTA Form */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              <AnimatePresence mode="wait">
                {!submitted ? (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    className="flex flex-col sm:flex-row items-center justify-center"
                    style={{ width: "100%", maxWidth: 580, gap: 16 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@gmail.com"
                      className="h-[56px] text-[15px] outline-none transition-all"
                      style={{
                        flex: "1 1 0%",
                        minWidth: 0,
                        paddingLeft: 28,
                        paddingRight: 20,
                        borderRadius: 100,
                        border: "1.5px solid #d4d4d4",
                        background: "#fff",
                        fontFamily: "var(--font-geist-sans)",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#000")}
                      onBlur={(e) => (e.target.style.borderColor = "#d4d4d4")}
                    />
                    <button
                      type="submit"
                      className="relative h-[56px] text-[15px] font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] pulse-ring whitespace-nowrap overflow-visible"
                      style={{
                        paddingLeft: 36,
                        paddingRight: 36,
                        borderRadius: 100,
                        background: "#000",
                        fontFamily: "var(--font-geist-sans)",
                      }}
                    >
                      Join Waitlist
                    </button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center gap-4 px-6 py-4"
                    style={{ background: "#fafafa", border: "1.5px solid #e8e8e8", borderRadius: 100 }}
                  >
                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[14px] font-medium" style={{ fontFamily: "var(--font-geist-sans)" }}>
                        You&apos;re #{spotNumber} on the list
                      </p>
                      <p className="text-[13px]" style={{ color: "#888" }}>
                        We&apos;ll reach out when your spot opens up.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="text-[12px] text-center" style={{ color: "#bbb", fontFamily: "var(--font-geist-mono)", marginTop: 20 }}>
                1,247 people ahead of you &middot; No spam, ever
              </p>
            </motion.div>
          </div>
        </section>

        {/* ── Metrics bar ────────────────────────────────── */}
        <section style={{ paddingTop: SECTION_GAP, paddingBottom: SECTION_GAP, borderTop: "1px solid rgba(0,0,0,0.06)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <SectionContainer>
            <div className="grid grid-cols-2 lg:grid-cols-4 w-full">
              {METRICS.map((m, i) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="py-10 px-6 sm:px-10 text-center flex flex-col items-center"
                  style={{
                    borderRight: i < 3 ? "1px solid rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  <p
                    className="text-[12px] uppercase tracking-[0.12em]"
                    style={{ color: "#999", fontFamily: "var(--font-geist-mono)", marginBottom: 12 }}
                  >
                    {m.label}
                  </p>
                  <p className="text-[36px] font-medium tracking-[-0.03em]" style={{ fontFamily: "var(--font-geist-sans)", marginBottom: 12 }}>
                    <AnimatedCounter target={m.value} />
                  </p>
                  <div className="flex items-center gap-4">
                    <span
                      className="text-[14px] font-medium"
                      style={{
                        color: m.up ? "#22c55e" : "#000",
                        fontFamily: "var(--font-geist-mono)",
                      }}
                    >
                      {m.change}
                    </span>
                    <Sparkline
                      data={m.up ? [20, 25, 22, 30, 28, 35, 40, 38, 45] : [45, 42, 38, 40, 35, 33, 30, 32, 28]}
                      color={m.up ? "#22c55e" : "#000"}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </SectionContainer>
        </section>

        {/* ── Graph showcase ──────────────────────────────── */}
        <section ref={graphRef} style={{ paddingTop: SECTION_GAP + 40, paddingBottom: SECTION_GAP }}>
          <SectionContainer>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center justify-center"
              style={{ marginBottom: SUBSECTION_GAP }}
            >
              <span
                className="text-[13px] uppercase tracking-[0.15em] block"
                style={{ color: "#999", fontFamily: "var(--font-geist-mono)", marginBottom: 16 }}
              >
                Dashboard Preview
              </span>
              <h2
                className="text-[clamp(2.4rem,5vw,3.8rem)] font-medium tracking-[-0.035em] leading-[1.1] text-center"
                style={{ fontFamily: "var(--font-geist-sans)" }}
              >
                Every signal,
                <br />
                <span style={{ color: "#ccc" }}>zero noise.</span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: CARD_GAP }}>
              {/* Big line chart */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="lg:col-span-2 rounded-2xl"
                style={{
                  background: "#fafafa",
                  border: "1px solid rgba(0,0,0,0.06)",
                  padding: CARD_PADDING,
                }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.1em]" style={{ color: "#999", fontFamily: "var(--font-geist-mono)", marginBottom: 4 }}>
                      Growth Trajectory
                    </p>
                    <p className="text-[22px] font-medium tracking-[-0.02em]" style={{ fontFamily: "var(--font-geist-sans)" }}>
                      <AnimatedCounter target="847" /> users
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {["1D", "1W", "1M", "1Y"].map((t, i) => (
                      <button
                        key={t}
                        className="px-3 py-1.5 rounded-lg text-[11px] transition-all"
                        style={{
                          background: i === 2 ? "#000" : "transparent",
                          color: i === 2 ? "#fff" : "#999",
                          fontFamily: "var(--font-geist-mono)",
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <svg width="100%" height="160" viewBox="0 0 500 100" preserveAspectRatio="none" fill="none">
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#000" stopOpacity="0.05" />
                      <stop offset="100%" stopColor="#000" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[20, 40, 60, 80].map((y) => (
                    <line key={y} x1="0" y1={y} x2="500" y2={y} stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
                  ))}
                  {graphInView && (
                    <>
                      <motion.path
                        d={pointsToArea(
                          GRAPH2_POINTS.map((p) => ({ x: p.x * 2.1, y: p.y })),
                          100
                        )}
                        fill="url(#areaGrad)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                      />
                      <motion.path
                        d={pointsToPath(GRAPH2_POINTS.map((p) => ({ x: p.x * 2.1, y: p.y })))}
                        stroke="#000"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 0.3, duration: 2, ease: "easeOut" }}
                      />
                      <motion.circle
                        cx={GRAPH2_POINTS[GRAPH2_POINTS.length - 1].x * 2.1}
                        cy={GRAPH2_POINTS[GRAPH2_POINTS.length - 1].y}
                        r="4"
                        fill="#000"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 2.3, duration: 0.3 }}
                      />
                      <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.5 }}
                      >
                        <rect
                          x={GRAPH2_POINTS[GRAPH2_POINTS.length - 1].x * 2.1 - 35}
                          y={GRAPH2_POINTS[GRAPH2_POINTS.length - 1].y - 30}
                          width="70" height="22" rx="6" fill="#000"
                        />
                        <text
                          x={GRAPH2_POINTS[GRAPH2_POINTS.length - 1].x * 2.1}
                          y={GRAPH2_POINTS[GRAPH2_POINTS.length - 1].y - 15}
                          textAnchor="middle"
                          fill="white"
                          fontSize="10"
                          fontFamily="var(--font-geist-mono)"
                        >
                          847 users
                        </text>
                      </motion.g>
                    </>
                  )}
                </svg>
              </motion.div>

              {/* Bar chart */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="rounded-2xl"
                style={{
                  background: "#fafafa",
                  border: "1px solid rgba(0,0,0,0.06)",
                  padding: CARD_PADDING,
                }}
              >
                <p className="text-[11px] uppercase tracking-[0.1em]" style={{ color: "#999", fontFamily: "var(--font-geist-mono)", marginBottom: 4 }}>
                  Daily Active
                </p>
                <p className="text-[22px] font-medium tracking-[-0.02em]" style={{ fontFamily: "var(--font-geist-sans)", marginBottom: 24 }}>
                  <AnimatedCounter target="92" />%
                </p>
                <div className="flex items-end justify-between gap-2" style={{ height: 120 }}>
                  {BAR_DATA.map((bar, i) => (
                    <div key={bar.label} className="flex flex-col items-center gap-2 flex-1">
                      <motion.div
                        className="w-full rounded-md"
                        style={{ background: i === 5 ? "#000" : "rgba(0,0,0,0.08)" }}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${bar.value}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      />
                      <span className="text-[9px]" style={{ color: "#bbb", fontFamily: "var(--font-geist-mono)" }}>
                        {bar.label}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Activity feed */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.25, duration: 0.6 }}
                className="rounded-2xl"
                style={{
                  background: "#fafafa",
                  border: "1px solid rgba(0,0,0,0.06)",
                  padding: CARD_PADDING,
                }}
              >
                <p className="text-[11px] uppercase tracking-[0.1em]" style={{ color: "#999", fontFamily: "var(--font-geist-mono)", marginBottom: 20 }}>
                  Live Events
                </p>
                <div className="flex flex-col" style={{ gap: 14 }}>
                  {[
                    { event: "New signup", time: "2s ago", dot: "#22c55e" },
                    { event: "Plan upgraded", time: "14s ago", dot: "#000" },
                    { event: "New signup", time: "31s ago", dot: "#22c55e" },
                    { event: "Feature used", time: "1m ago", dot: "#999" },
                    { event: "New signup", time: "2m ago", dot: "#22c55e" },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ background: item.dot }} />
                        <span className="text-[13px]" style={{ fontFamily: "var(--font-geist-sans)" }}>
                          {item.event}
                        </span>
                      </div>
                      <span className="text-[11px]" style={{ color: "#bbb", fontFamily: "var(--font-geist-mono)" }}>
                        {item.time}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Donut / ring chart */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="lg:col-span-2 rounded-2xl flex flex-col sm:flex-row items-center"
                style={{
                  background: "#fafafa",
                  border: "1px solid rgba(0,0,0,0.06)",
                  padding: CARD_PADDING,
                  gap: 32,
                }}
              >
                <div className="flex-1">
                  <p className="text-[11px] uppercase tracking-[0.1em]" style={{ color: "#999", fontFamily: "var(--font-geist-mono)", marginBottom: 4 }}>
                    Traffic Sources
                  </p>
                  <p className="text-[22px] font-medium tracking-[-0.02em]" style={{ fontFamily: "var(--font-geist-sans)", marginBottom: 20 }}>
                    <AnimatedCounter target="38,420" /> visits
                  </p>
                  <div className="flex flex-col" style={{ gap: 10 }}>
                    {[
                      { label: "Direct", pct: 42, color: "#000" },
                      { label: "Organic", pct: 31, color: "#666" },
                      { label: "Referral", pct: 18, color: "#bbb" },
                      { label: "Social", pct: 9, color: "#e5e5e5" },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
                        <span className="text-[13px] flex-1" style={{ fontFamily: "var(--font-geist-sans)" }}>
                          {s.label}
                        </span>
                        <span className="text-[12px]" style={{ color: "#999", fontFamily: "var(--font-geist-mono)" }}>
                          {s.pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <svg width="140" height="140" viewBox="0 0 140 140">
                  {[
                    { pct: 42, color: "#000", offset: 0 },
                    { pct: 31, color: "#666", offset: 42 },
                    { pct: 18, color: "#bbb", offset: 73 },
                    { pct: 9, color: "#e5e5e5", offset: 91 },
                  ].map((seg, i) => {
                    const r = 58;
                    const circ = 2 * Math.PI * r;
                    return (
                      <motion.circle
                        key={i}
                        cx="70" cy="70" r={r}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${(seg.pct / 100) * circ - 4} ${circ}`}
                        initial={{ strokeDashoffset: circ, opacity: 0 }}
                        whileInView={{ strokeDashoffset: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 + i * 0.15, duration: 1, ease: "easeOut" }}
                        style={{
                          transformOrigin: "70px 70px",
                          transform: `rotate(${(seg.offset / 100) * 360 - 90}deg)`,
                        }}
                      />
                    );
                  })}
                  <text x="70" y="66" textAnchor="middle" fill="#000" fontSize="22" fontWeight="500" fontFamily="var(--font-geist-sans)">
                    38k
                  </text>
                  <text x="70" y="82" textAnchor="middle" fill="#999" fontSize="10" fontFamily="var(--font-geist-mono)">
                    total visits
                  </text>
                </svg>
              </motion.div>
            </div>
          </SectionContainer>
        </section>

        {/* ── Features strip ─────────────────────────────── */}
        <section style={{ paddingTop: SECTION_GAP, paddingBottom: SECTION_GAP, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <SectionContainer maxWidth={960}>
            <div className="grid grid-cols-1 sm:grid-cols-3 text-center" style={{ gap: 48 }}>
              {[
                {
                  title: "Real-time",
                  desc: "See every event as it happens. No batching, no delays. Your data, live.",
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.8" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  ),
                },
                {
                  title: "Privacy-first",
                  desc: "No cookies, no fingerprinting. Compliant by design. Your users stay anonymous.",
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.8" strokeLinecap="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  ),
                },
                {
                  title: "Lightweight",
                  desc: "Under 1KB script. Zero impact on performance. Faster than the alternatives.",
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.8" strokeLinecap="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  ),
                },
              ].map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto"
                    style={{ background: "#f5f5f5", marginBottom: 16 }}
                  >
                    {f.icon}
                  </div>
                  <h3
                    className="text-[15px] font-medium tracking-[-0.01em]"
                    style={{ fontFamily: "var(--font-geist-sans)", marginBottom: 8 }}
                  >
                    {f.title}
                  </h3>
                  <p className="text-[13px] leading-[1.7]" style={{ color: "#888" }}>
                    {f.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </SectionContainer>
        </section>

        {/* ── Bottom CTA ─────────────────────────────────── */}
        <section style={{ paddingTop: SECTION_GAP, paddingBottom: SECTION_GAP, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <SectionContainer maxWidth={560}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
              style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              <h2
                className="text-[clamp(1.8rem,3.5vw,2.4rem)] font-medium tracking-[-0.03em]"
                style={{ fontFamily: "var(--font-geist-sans)", marginBottom: 16, lineHeight: 1.2 }}
              >
                Ready to know
                <br />your baseline?
              </h2>
              <p className="text-[14px]" style={{ color: "#888", marginBottom: 40 }}>
                Join the waitlist. Be first to get access.
              </p>
              {!submitted ? (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center w-full" style={{ gap: 12 }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="h-[48px] text-[14px] outline-none transition-all"
                    style={{
                      flex: "1 1 0%",
                      minWidth: 0,
                      paddingLeft: 24,
                      paddingRight: 16,
                      borderRadius: 100,
                      border: "1.5px solid #d4d4d4",
                      background: "#fff",
                      fontFamily: "var(--font-geist-sans)",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#000")}
                    onBlur={(e) => (e.target.style.borderColor = "#d4d4d4")}
                  />
                  <button
                    type="submit"
                    className="h-[48px] text-[14px] font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] whitespace-nowrap"
                    style={{
                      paddingLeft: 28,
                      paddingRight: 28,
                      borderRadius: 100,
                      background: "#000",
                      fontFamily: "var(--font-geist-sans)",
                    }}
                  >
                    Join Waitlist
                  </button>
                </form>
              ) : (
                <p className="text-[14px] font-medium" style={{ color: "#22c55e" }}>
                  You&apos;re on the list. We&apos;ll be in touch.
                </p>
              )}
            </motion.div>
          </SectionContainer>
        </section>

        {/* ── Footer ─────────────────────────────────────── */}
        <footer
          className="flex flex-col items-center justify-center"
          style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 40, paddingBottom: 40, gap: 12 }}
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 relative">
              <div className="absolute inset-0 bg-black rounded-[4px]" />
              <div className="absolute top-[4px] left-[4px] w-[5px] h-[1px] bg-white rounded-full" />
              <div className="absolute top-[7.5px] left-[4px] w-[8px] h-[1px] bg-white rounded-full" />
              <div className="absolute top-[11px] left-[4px] w-[6px] h-[1px] bg-white rounded-full" />
            </div>
            <span className="text-[13px] font-medium tracking-[-0.01em]" style={{ fontFamily: "var(--font-geist-sans)" }}>
              Baseline
            </span>
          </div>
          <p className="text-[12px]" style={{ color: "#bbb", fontFamily: "var(--font-geist-mono)" }}>
            &copy; {new Date().getFullYear()} Baseline. All rights reserved.
          </p>
        </footer>

      </div>
    </div>
  );
}
