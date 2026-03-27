"use client";

import { useState, useEffect } from "react";

interface WaitlistEntry {
  id: number;
  email: string;
  name: string;
  position: number;
  created_at: string;
  usecase: string | null;
}

export default function AdminPage() {
  const [key, setKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async (adminKey: string) => {
    setLoading(true);
    setError("");
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${API_URL}/api/waitlist/admin`, {
        headers: { Authorization: `Bearer ${adminKey}` },
      });
      if (!res.ok) {
        setError("invalid key");
        setAuthenticated(false);
        return;
      }
      const data = await res.json();
      setEntries(data.entries);
      setTotal(data.total);
      setAuthenticated(true);
    } catch {
      setError("failed to connect");
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 30s when authenticated
  useEffect(() => {
    if (!authenticated) return;
    const interval = setInterval(() => fetchData(key), 30000);
    return () => clearInterval(interval);
  }, [authenticated, key]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) fetchData(key.trim());
  };

  if (!authenticated) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-geist-mono)",
          background: "#fff",
        }}
      >
        <form onSubmit={handleLogin} style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, color: "#111", marginBottom: 16 }}>
            enter admin key
          </div>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            autoFocus
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: 14,
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: 4,
              outline: "none",
              width: 260,
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              marginLeft: 8,
              fontFamily: "var(--font-geist-mono)",
              fontSize: 14,
              padding: "8px 16px",
              border: "1px solid #dc143c",
              borderRadius: 4,
              background: "none",
              color: "#dc143c",
              cursor: "pointer",
            }}
          >
            {loading ? "..." : "go"}
          </button>
          {error && (
            <div style={{ color: "#dc143c", fontSize: 12, marginTop: 12 }}>
              {error}
            </div>
          )}
        </form>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily: "var(--font-geist-mono)",
        background: "#fff",
        padding: "32px 24px",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <span style={{ fontSize: 18, color: "#111" }}>baseline waitlist</span>
          <span
            style={{
              fontSize: 13,
              color: "#999",
              marginLeft: 12,
            }}
          >
            {total} {total === 1 ? "signup" : "signups"}
          </span>
        </div>
        <button
          onClick={() => fetchData(key)}
          disabled={loading}
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: 12,
            padding: "4px 12px",
            border: "1px solid #ddd",
            borderRadius: 4,
            background: "none",
            color: "#666",
            cursor: "pointer",
          }}
        >
          {loading ? "loading..." : "refresh"}
        </button>
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: "1px solid #eee",
              textAlign: "left",
              color: "#999",
            }}
          >
            <th style={{ padding: "8px 12px", fontWeight: 500 }}>#</th>
            <th style={{ padding: "8px 12px", fontWeight: 500 }}>name</th>
            <th style={{ padding: "8px 12px", fontWeight: 500 }}>email</th>
            <th style={{ padding: "8px 12px", fontWeight: 500 }}>usecase</th>
            <th style={{ padding: "8px 12px", fontWeight: 500 }}>joined</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.id}
              style={{ borderBottom: "1px solid #f5f5f5" }}
            >
              <td style={{ padding: "10px 12px", color: "#999" }}>
                {entry.position}
              </td>
              <td style={{ padding: "10px 12px", color: "#111" }}>
                {entry.name}
              </td>
              <td style={{ padding: "10px 12px", color: "#111" }}>
                {entry.email}
              </td>
              <td
                style={{
                  padding: "10px 12px",
                  color: entry.usecase ? "#444" : "#ccc",
                  maxWidth: 200,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {entry.usecase ?? "—"}
              </td>
              <td style={{ padding: "10px 12px", color: "#999" }}>
                {new Date(entry.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {entries.length === 0 && (
        <div
          style={{
            textAlign: "center",
            color: "#ccc",
            padding: 48,
            fontSize: 13,
          }}
        >
          no signups yet
        </div>
      )}
    </div>
  );
}
