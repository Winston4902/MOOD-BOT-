// frontend/src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../lib/api.js";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Card } from "../components/ui.jsx";

/**
 * Dashboard (personalized greeting + stats + charts)
 *
 * - Replaces "Dashboard" header with "Hi {name}" (name parsed from JWT token if present)
 * - Removes the recent entries list entirely (as requested)
 * - Keeps stat cards, trend chart and distribution chart
 */

const PRIMARY = "#2563EB"; // blue-600

function StatCard({ title, value, subtitle }) {
  return (
    <div className="p-4 bg-white rounded-2xl shadow-sm border">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="mt-2 flex items-end gap-3">
        <div className="text-2xl font-semibold">{value}</div>
      </div>
      {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
    </div>
  );
}

// Decode JWT payload (no library) — returns parsed payload or null
function parseJwtPayload(token) {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1];
    // base64url -> base64
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(b64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

function getUserNameFromToken() {
  try {
    const token = localStorage.getItem("token");
    const payload = parseJwtPayload(token);
    if (!payload) return null;
    // common fields to try
    return payload.name || payload.fullname || payload.username || payload.preferred_username || payload.email || null;
  } catch (e) {
    return null;
  }
}

export default function Dashboard() {
  const [items, setItems] = useState([]); // raw items from API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // derive name synchronously from token (no extra API call)
  const userName = getUserNameFromToken();
  const greetingName = userName ? userName.split(" ")[0] : "there"; // show first name if available

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/mood"); // GET /api/mood
        // handle shapes: { data: items } OR direct array
        let payload = [];
        if (res?.data) {
          // if res.data.data is array, use that. Otherwise if res.data is array, use it.
          if (Array.isArray(res.data.data)) payload = res.data.data;
          else if (Array.isArray(res.data)) payload = res.data;
          else if (Array.isArray(res.data.items)) payload = res.data.items;
          else payload = res.data;
        } else {
          payload = [];
        }
        const arr = Array.isArray(payload) ? payload : [];
        setItems(arr.slice(0, 500));
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load mood history");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Normalize items
  const norm = useMemo(
    () =>
      items.map((d) => ({
        id: d.id ?? d._id,
        label: d.label ?? "neutral",
        score: Number(d.score ?? 3),
        dateISO: d.date ?? null,
        local: d.local ?? (d.date ? new Date(d.date).toLocaleString() : null),
      })),
    [items]
  );

  // Recent sorted (most recent first)
  const recent = useMemo(
    () =>
      norm
        .slice()
        .sort((a, b) => {
          const ta = a.dateISO ? new Date(a.dateISO).getTime() : 0;
          const tb = b.dateISO ? new Date(b.dateISO).getTime() : 0;
          return tb - ta;
        }),
    [norm]
  );

  // Line chart data (last 30, chronological)
  const lineData = useMemo(() => {
    const last = recent.slice(0, 30).slice().reverse();
    return last.map((d) => ({
      date: d.dateISO ? new Date(d.dateISO).toLocaleDateString() : "",
      score: d.score,
      label: d.label,
    }));
  }, [recent]);

  // Average score
  const avgScore = useMemo(() => {
    if (!norm.length) return 0;
    const sum = norm.reduce((s, x) => s + (Number(x.score) || 0), 0);
    return +(sum / norm.length).toFixed(1);
  }, [norm]);

  // Latest mood
  const latest = recent[0] ?? null;

  // Negative consecutive streak (score <= 2)
  const negativeStreak = useMemo(() => {
    let count = 0;
    for (const entry of recent) {
      if (entry.score <= 2) count++;
      else break;
    }
    return count;
  }, [recent]);

  // Distribution counts for labels (top 6)
  const distribution = useMemo(() => {
    const map = new Map();
    for (const e of norm) {
      map.set(e.label, (map.get(e.label) || 0) + 1);
    }
    const arr = Array.from(map.entries()).map(([label, count]) => ({ label, count }));
    arr.sort((a, b) => b.count - a.count);
    return arr.slice(0, 6);
  }, [norm]);

  const yDomain = [1, 5];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hi {greetingName}</h1>
        <p className="text-sm text-gray-600">Snapshot of your recent moods and trends</p>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Average mood (all saved)"
          value={loading ? "…" : (avgScore === 0 ? "—" : avgScore)}
          subtitle={`${norm.length} entries`}
        />
        <StatCard
          title="Latest mood"
          value={loading ? "…" : (latest ? `${latest.label} (${latest.score}/5)` : "—")}
          subtitle={latest ? latest.local : "No recent entry"}
        />
        <StatCard
          title="Negative consecutive streak"
          value={loading ? "…" : negativeStreak}
          subtitle={negativeStreak >= 5 ? "Consider uplifting content" : "Keep tracking daily"}
        />
      </div>

      {/* Main charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-gray-500">Mood trend</div>
              <div className="text-lg font-semibold">Last {lineData.length} entries</div>
            </div>
            <div className="text-xs text-gray-400">Score scale: 1 (low) — 5 (high)</div>
          </div>

          <div style={{ width: "100%", height: 260 }}>
            {loading ? (
              <div className="flex items-center justify-center h-full">Loading...</div>
            ) : lineData.length === 0 ? (
              <div className="text-sm text-gray-500">No data to show yet.</div>
            ) : (
              <ResponsiveContainer>
                <LineChart data={lineData} margin={{ top: 6, right: 12, left: 0, bottom: 6 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={yDomain} allowDecimals={false} />
                  <Tooltip
                    formatter={(value, name, props) => {
                      if (name === "score") return [`${value}/5`, "Score"];
                      return [value, name];
                    }}
                  />
                  <Line type="monotone" dataKey="score" stroke={PRIMARY} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-gray-500">Mood distribution</div>
              <div className="text-lg font-semibold">Top moods</div>
            </div>
            <div className="text-xs text-gray-400">Counts across saved entries</div>
          </div>

          <div style={{ width: "100%", height: 260 }}>
            {loading ? (
              <div className="flex items-center justify-center h-full">Loading...</div>
            ) : distribution.length === 0 ? (
              <div className="text-sm text-gray-500">No data yet.</div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={distribution} layout="vertical" margin={{ top: 6, right: 12, left: 12, bottom: 6 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="label" type="category" width={110} />
                  <Tooltip />
                  <Bar dataKey="count" barSize={14}>
                    {distribution.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={PRIMARY} opacity={0.9 - Math.min(0.4, idx * 0.05)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
