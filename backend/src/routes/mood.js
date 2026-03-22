// backend/src/routes/mood.js
import express from "express";
import { MoodEntry } from "../models/MoodEntry.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Helper: map frontend moodType -> MoodEntry label + score
function mapMoodTypeToLabelScore(moodType) {
  const t = (moodType || "").toLowerCase();
  switch (t) {
    case "very_sad":
    case "sad":
      return { label: "very_sad", score: 1 };
    case "stressed":
    case "anxious":
    case "angry":
      return { label: "sad", score: 2 };
    case "neutral":
    case "tired":
      return { label: "neutral", score: 3 };
    case "happy":
      return { label: "happy", score: 4 };
    case "excited":
    case "grateful":
      return { label: "very_happy", score: 5 };
    default:
      return { label: "neutral", score: 3 };
  }
}

/**
 * POST /api/mood
 * Save a mood entry from the frontend mood tracker.
 * Body: { moodType, note, date }
 */
router.post("/", auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { moodType, note = "", date: dateStr } = req.body;
    if (!moodType) return res.status(400).json({ message: "moodType is required" });

    const { label, score } = mapMoodTypeToLabelScore(moodType);
    const date = dateStr ? new Date(dateStr) : new Date();

    const entry = new MoodEntry({
      userId,
      date,
      label,
      score,
      // keep note/message in DB but do not expose it in GET responses
      reason: note || "",
      message: note || ""
    });

    await entry.save();
    return res.status(201).json({ message: "Mood saved", entryId: entry._id });
  } catch (err) {
    console.error("save mood error:", err);
    return res.status(500).json({ message: "server_error" });
  }
});

/**
 * GET /api/mood
 * Return recent mood entries for the authenticated user (most recent first).
 * NOTE: this response intentionally does NOT include 'message' or 'reason'.
 */
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const docs = await MoodEntry.find({ userId })
      .sort({ date: -1 })
      .limit(500)
      .lean();

    // Build items WITHOUT including message or reason
    const items = docs.map(d => ({
      id: d._id,
      label: d.label,
      score: d.score,
      date: d.date ? d.date.toISOString() : null,
      local: d.date ? new Date(d.date).toLocaleString() : null
    }));

    return res.json({ data: items });
  } catch (err) {
    console.error("mood history error:", err);
    return res.status(500).json({ message: "server_error" });
  }
});

/**
 * GET /api/mood/history (legacy endpoint) — also WITHOUT message/reason
 */
router.get("/history", auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const docs = await MoodEntry.find({ userId }).sort({ date: -1 }).limit(200).lean();

    const items = docs.map(d => ({
      id: d._id,
      label: d.label,
      score: d.score,
      date: d.date ? d.date.toISOString() : null,
      local: d.date ? new Date(d.date).toLocaleString() : null
    }));

    return res.json({ data: items });
  } catch (err) {
    console.error("mood history error:", err);
    return res.status(500).json({ message: "server_error" });
  }
});

export default router;
