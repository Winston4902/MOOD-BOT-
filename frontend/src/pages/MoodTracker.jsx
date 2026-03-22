// frontend/src/pages/MoodTracker.jsx
import { useState, useEffect } from "react";
import api from "../lib/api.js";
import { Card } from "../components/ui.jsx";

export default function MoodTracker() {
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    setRefreshing(true);
    try {
      const { data } = await api.get("/mood"); // GET /api/mood
      const items = data?.data || data || [];
      setHistory(items);
    } catch (err) {
      console.error("Failed to load mood history:", err);
      setHistory([]);
    } finally {
      setRefreshing(false);
    }
  }

  const getMoodEmoji = (score) => {
    if (score <= 1) return "😢";
    if (score === 2) return "😔";
    if (score === 3) return "😐";
    if (score === 4) return "😊";
    return "😄";
  };

  return (
    <Card className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mood Tracker</h1>
        <p className="text-sm text-gray-600">Your recent moods </p>
      </div>

      <div className="flex items-center justify-between">
        <div />
        <button
          onClick={fetchHistory}
          className="text-sm text-blue-600 hover:underline"
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Mood history list */}
      {history.length === 0 ? (
        <div className="text-sm text-gray-500">No mood entries yet.</div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div key={item.id} className="border rounded p-3 bg-white shadow-sm">
              <div className="flex justify-between items-start">
                <div className="w-full pr-4">
                  <div className="text-sm text-gray-600">
                    {item.local || (item.date ? new Date(item.date).toLocaleString() : "")}
                  </div>

                  <div className="text-md font-semibold mt-1 flex items-center justify-between">
                    <div>
                      {item.label} {item.score ? <span className="text-sm text-gray-500">({item.score}/5)</span> : null}
                    </div>
                    <div className="text-2xl ml-3">{getMoodEmoji(item.score)}</div>
                  </div>

                  {/* Horizontal score bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded h-3 overflow-hidden" aria-hidden>
                      <div
                        className="h-3 bg-blue-500 rounded transition-all duration-300"
                        style={{ width: `${Math.max(0, Math.min(5, item.score)) / 5 * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Score visualization</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
