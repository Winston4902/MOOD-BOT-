// frontend/src/pages/Chatbot.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api.js";
import { Card, Button } from "../components/ui.jsx";

export default function Chatbot() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [mood, setMood] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [consecutiveSad, setConsecutiveSad] = useState(0);
  const [counterReset, setCounterReset] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login", { replace: true });
  }, [navigate]);

  async function send() {
    setLoading(true);
    setReply("");
    setMood(null);
    setRecommendations(null);
    setCounterReset(false);
    
    try {
      const payload = { message: message.trim() || "I'm feeling a bit off and would like some support." };
      const { data } = await api.post("/chat", payload);
      
      setReply(data.reply || "");
      setMood(data.mood || null);
      setRecommendations(data.recommendations || null);
      setConsecutiveSad(data.consecutiveSad || 0);
      setCounterReset(data.counterReset || false);
      
      // Log mood details to console for debugging
      if (data.mood) {
        console.log("🎭 Mood Analysis:", {
          label: data.mood.label,
          score: data.mood.score,
          reason: data.mood.reason,
          consecutiveSad: data.consecutiveSad
        });
      }
      
      // Clear message after successful send
      setMessage("");
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }
      setReply(err.response?.data?.error || "Failed to fetch response");
    } finally {
      setLoading(false);
    }
  }

  // Helper to get mood emoji
  const getMoodEmoji = (score) => {
    if (score <= 1) return "😢";
    if (score === 2) return "😔";
    if (score === 3) return "😐";
    if (score === 4) return "😊";
    return "😄";
  };

  // Helper to get streak status color
  const getStreakColor = (count) => {
    if (count === 0) return "text-green-600";
    if (count < 3) return "text-yellow-600";
    if (count < 5) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <Card className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Chatbot Helper</h1>
        <p className="text-sm text-gray-600">Get supportive, empathetic responses</p>
      </div>

      {/* Mood Streak Indicator */}
      <div className={`rounded-lg p-3 border ${consecutiveSad >= 5 ? 'bg-red-50 border-red-200' : consecutiveSad >= 3 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium">Negative Mood Streak: </span>
            <span className={`text-lg font-bold ${getStreakColor(consecutiveSad)}`}>
              {consecutiveSad}
            </span>
          </div>
          {consecutiveSad >= 5 && (
            <span className="text-sm text-red-600 font-medium">
              📢 Uplifting content will be sent!
            </span>
          )}
          {consecutiveSad === 0 && (
            <span className="text-sm text-green-600 font-medium">
              ✨ Doing great!
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {consecutiveSad >= 5 
            ? "You've been feeling down. Let me help brighten your day!" 
            : consecutiveSad >= 3 
            ? "I'm noticing some sadness. Share how you feel." 
            : "Counter resets when you share happy thoughts!"}
        </p>
      </div>

      <textarea
        rows={4}
        className="input w-full"
        placeholder="Type how you feel... (e.g., 'I'm feeling great today!' or 'I've been feeling down lately')"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
      />

      <Button onClick={send} disabled={loading}>
        {loading ? "Thinking..." : "Send Message"}
      </Button>

      {counterReset && (
        <div className="rounded-lg p-3 bg-green-100 border border-green-300 text-green-800 text-sm">
          🎉 Great news! Your positive mood has reset the counter. Keep it up!
        </div>
      )}

      {reply && (
        <div className="rounded-xl p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border shadow-sm text-sm">
          <div className="font-semibold mb-2 text-indigo-900">💬 Assistant</div>
          <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">{reply}</div>
        </div>
      )}


      {recommendations && (
        <div className="rounded-lg p-4 border-2 border-purple-200 bg-purple-50 mt-2 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎁</span>
            <h4 className="font-bold text-lg text-purple-900">Special Recommendations for You</h4>
          </div>
          
          <p className="text-sm text-purple-700 font-medium">{recommendations.message}</p>
          
          {recommendations.quote && (
            <div className="bg-white p-3 rounded border border-purple-200">
              <p className="text-xs text-purple-600 font-semibold mb-1">💭 INSPIRATIONAL QUOTE</p>
              <blockquote className="italic text-gray-700">
                "{recommendations.quote.text}"
              </blockquote>
              <p className="text-right text-sm text-gray-600 mt-1">— {recommendations.quote.author}</p>
            </div>
          )}
          
          {recommendations.songs && recommendations.songs.length > 0 && (
            <div className="bg-white p-3 rounded border border-purple-200">
              <p className="text-xs text-purple-600 font-semibold mb-2">🎵 UPLIFTING SONGS</p>
              <div className="space-y-1">
                {recommendations.songs.map((s, i) => (
                  <div key={i} className="text-sm">
                    <a 
                      href={s.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      🎶 {s.trackName} — {s.artistName}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {recommendations.memes && recommendations.memes.length > 0 && (
            <div className="bg-white p-3 rounded border border-purple-200">
              <p className="text-xs text-purple-600 font-semibold mb-2">😄 WHOLESOME MEMES</p>
              <div className="space-y-2">
                {recommendations.memes.map((m, i) => (
                  <div key={i} className="border-b border-gray-100 last:border-0 pb-2">
                    <a 
                      href={m.postLink} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                    >
                      {m.title}
                    </a>
                    {m.url && (
                      <img 
                        src={m.url} 
                        alt={m.title} 
                        className="mt-2 rounded max-h-48 object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}