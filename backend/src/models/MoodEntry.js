// backend/src/models/MoodEntry.js
import mongoose from "mongoose";

const moodSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  date: { type: Date, default: () => new Date(), index: true },
  label: {
    type: String,
    required: true,
    enum: ["very_sad", "sad", "neutral", "happy", "very_happy"]
  },
  score: { type: Number, required: true, min: 1, max: 5 },
  reason: { type: String, default: "", maxlength: 300 },
  message: { type: String, default: "" }
});

export const MoodEntry = mongoose.models.MoodEntry || mongoose.model("MoodEntry", moodSchema);
