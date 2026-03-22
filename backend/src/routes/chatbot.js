// backend/src/routes/chatbot.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import fetch from "node-fetch";
import { MoodEntry } from "../models/MoodEntry.js";
import ConversationSummary from "../models/ConversationSummary.js";
import auth from "../middleware/auth.js";

const router = express.Router();

if (!process.env.GOOGLE_API_KEY) {
  console.warn("[chatbot] WARNING: GOOGLE_API_KEY not set in .env");
}

// Instantiate Gemini
const chatModel = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  model: process.env.GOOGLE_MODEL || "gemini-2.5-flash",
  temperature: 0.2,
  maxOutputTokens: 512
});

// ----------------- Safety / recommendation constants -----------------
const SUICIDAL_REGEX = /\b(suicide|kill myself|end my life|want to die|die by|hurt myself|self[- ]?harm)\b/i;

// Helplines (India) - included only when message appears suicidal. Modify as needed.
const INDIA_HELPLINES = [
  { name: "KIRAN (24x7 Mental Health Helpline)", number: "1800-599-0019" },
  { name: "Tele-MANAS (MoHFW)", number: "14416" },
  { name: "Vandrevala Foundation (crisis)", number: "+91 9999 666 555" },
  { name: "AASRA (suicide prevention NGO)", number: "022-2754 6669" }
];

// Positive activities to recommend when sadness streak is high
const POSITIVE_ACTIVITIES = [
  "Go for a short walk (15–30 mins) — fresh air can help",
  "Gentle run or light exercise (even 10 mins helps)",
  "Simple breathing or grounding exercise (box breathing: 4-4-4)",
  "Make a short to-do list / pick one small achievable task",
  "Call or text a trusted friend or family member",
  "Write for 5–10 minutes (journal one good thing)",
  "Spend 10–15 minutes in sunlight or near a window",
  "Try a brief guided meditation or calming playlist"
];

// ----------------- Recommendation helpers -----------------
async function fetchSongs() {
  try {
    const r = await fetch('https://itunes.apple.com/search?term=happy+uplifting&media=music&limit=5');
    if (!r.ok) return [];
    const j = await r.json();
    return (j.results || []).slice(0, 3).map(s => ({
      trackName: s.trackName || "(unknown)",
      artistName: s.artistName || "(unknown)",
      url: s.trackViewUrl || s.previewUrl || ""
    }));
  } catch (e) {
    console.error("[fetchSongs] error:", e && (e.message || e));
    return [];
  }
}

async function fetchQuote() {
  try {
    const r1 = await fetch('https://api.quotable.io/random?tags=inspirational');
    if (r1.ok) {
      const j1 = await r1.json();
      if (j1?.content) return { text: j1.content, author: j1.author || "Unknown" };
    }
    const r2 = await fetch('https://api.quotable.io/random');
    if (r2.ok) {
      const j2 = await r2.json();
      if (j2?.content) return { text: j2.content, author: j2.author || "Unknown" };
    }
    return null;
  } catch (e) {
    console.error("[fetchQuote] error:", e && (e.message || e));
    return null;
  }
}

async function fetchMemes(count = 3) {
  try {
    const url = `https://meme-api.com/gimme/wholesomememes/${count}`;
    const r = await fetch(url);
    if (!r.ok) {
      console.error("[fetchMemes] non-OK:", r.status);
      return [];
    }
    const j = await r.json();
    if (Array.isArray(j.memes) && j.memes.length) {
      return j.memes.map(m => ({ title: m.title || "(untitled)", url: m.url, postLink: m.postLink || "" }));
    }
    if (j && (j.postLink || j.url || j.preview)) {
      return [{ title: j.title || "(meme)", url: j.url || (Array.isArray(j.preview) ? j.preview[0] : undefined), postLink: j.postLink || "" }];
    }
    return [];
  } catch (e) {
    console.error("[fetchMemes] error:", e && (e.message || e));
    return [];
  }
}

// ----------------- LLM helpers -----------------

/**
 * Get assistant reply — includes previousSummary (single string) in the human message.
 * previousSummary may be empty string.
 */
async function getAssistantReply({ previousSummary = "", message = "", shouldUplift = false }) {
  try {
    const systemPrompt = shouldUplift
      ? `You are an empathetic assistant. The user has been sad for a while.
First, directly and concisely answer the user's question or respond to their request (one clear paragraph or direct answer).
After that, add a short (1-2 sentence) uplifting and encouraging note. If the message indicates self-harm or suicidal intent, include a brief directive to seek immediate help and offer resources (do NOT include phone numbers; those will be added by the application logic).
Keep the whole reply concise and helpful.`
      : "You are an empathetic assistant. Keep replies concise.";

    const system = new SystemMessage(systemPrompt);

    // Include previous summary in the human message so assistant has memory
    const humanText = previousSummary
      ? `Previous conversation summary (do not repeat unless asked): """${previousSummary}"""\n\nNow the user's message:\n"""${message}"""`
      : `User message:\n"""${message}"""`;

    const human = new HumanMessage(humanText);
    const resp = await chatModel.invoke([system, human]);
    return resp.content ?? resp.text ?? resp.outputText ?? JSON.stringify(resp);
  } catch (e) {
    console.error("[getAssistantReply] error:", e && (e.message || e));
    return "Sorry — I'm having trouble right now. Please try again.";
  }
}

/**
 * Ask Gemini to produce a short, single-string conversation summary (<=300 words).
 * If previousSummary is provided, instruct the model to update/merge it with the new text.
 * Returns the summary string (trimmed, up to a safe char limit).
 */
async function createAndUpsertSingleSummary(userId, newConversationText, previousSummary = "") {
  const prev = previousSummary || "(none)";

  const systemText = `
You are a concise summarizer. Produce a SINGLE PARAGRAPH summary (plain text only) that captures the user's conversation history.
If a PREVIOUS SUMMARY is provided, update and merge it with the new conversation to produce a single, coherent summary representing the entire history.
Requirements:
- Output ONLY the updated summary text (no JSON, no explanation, no extra lines).
- Maximum length: about 300 words. Keep it concise and factual.
- Preserve personal details (name, study/work, location) if mentioned, but do not invent facts.
- If personal details appear, include them briefly in the summary.
`.trim();

  const humanText = `
PreviousSummary:
"""${prev}"""

NewConversation:
"""${newConversationText}"""

Produce only the updated single-paragraph summary text (max ~300 words).
`.trim();

  try {
    const system = new SystemMessage(systemText);
    const human = new HumanMessage(humanText);
    const resp = await chatModel.invoke([system, human]);

    let raw = (resp.content ?? resp.text ?? resp.outputText ?? "").trim();
    raw = raw.replace(/```(?:text|txt|plain)?\s*/g, '').replace(/```\s*/g, '').trim();

    const MAX_CHARS = 2500;
    let final = raw.slice(0, MAX_CHARS).trim();

    if (!final) {
      final = newConversationText.length > 400 ? newConversationText.slice(0, 400) + "..." : newConversationText;
    }

    const updated = await ConversationSummary.findOneAndUpdate(
      { userId },
      { summary: final, updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return (updated && updated.summary) || final;
  } catch (e) {
    console.error("[createAndUpsertSingleSummary] error:", e && (e.message || e));
    const fallback = newConversationText.length > 400 ? newConversationText.slice(0, 400) + "..." : newConversationText;
    try {
      const updated = await ConversationSummary.findOneAndUpdate(
        { userId },
        { summary: fallback, updatedAt: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return (updated && updated.summary) || fallback;
    } catch (inner) {
      console.error("[createAndUpsertSingleSummary] fallback DB error:", inner && (inner.message || inner));
      return fallback;
    }
  }
}

// ----------------- Misc helpers -----------------
async function getConsecutiveSadCount(userId) {
  const recentEntries = await MoodEntry.find({ userId }).sort({ date: -1 }).limit(10).select('score label');
  let consecutiveSad = 0;
  for (const entry of recentEntries) {
    if (entry.score <= 2) consecutiveSad++;
    else if (entry.score >= 4) break;
    else continue;
  }
  return consecutiveSad;
}

// ----------------- Routes -----------------

// Optional debug endpoint to check single-summary storage
router.get("/summary/debug", auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const doc = await ConversationSummary.findOne({ userId }).lean();
    return res.json({ ok: true, summaryExists: !!doc, summary: doc ? doc.summary : "" });
  } catch (e) {
    console.error("[/summary/debug] error:", e && (e.message || e));
    return res.status(500).json({ ok: false, error: String(e && (e.message || e)) });
  }
});

// Main chat endpoint
router.post("/chat", auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { message } = req.body;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!message || typeof message !== "string") return res.status(400).json({ error: "message required" });

    // 1) mood classification
    const mood = await (async () => {
      const systemText = `
You are a sentiment/mood classifier. Output STRICT JSON only (no extra text).
Schema:
{
  "label": one of ["very_sad","sad","neutral","happy","very_happy"],
  "score": integer 1-5 (1 very negative, 5 very positive),
  "reason": short text (<=100 chars)
}
Return only JSON.
`.trim();

      const sys = new SystemMessage(systemText);
      const hum = new HumanMessage(`Message: """${message}"""`);
      try {
        const r = await chatModel.invoke([sys, hum]);
        let raw = (r.content ?? r.text ?? r.outputText ?? "").trim();
        raw = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        const start = raw.indexOf("{");
        const end = raw.lastIndexOf("}");
        const jsonText = (start >= 0 && end >= 0) ? raw.slice(start, end + 1) : raw;
        const parsed = JSON.parse(jsonText);
        parsed.score = Math.round(Number(parsed.score) || 3);
        if (parsed.score < 1) parsed.score = 1;
        if (parsed.score > 5) parsed.score = 5;
        parsed.label = String(parsed.label || "neutral");
        parsed.reason = String(parsed.reason || "").slice(0, 300);
        try {
          const tmp = new MoodEntry({ userId: "temp", message: "", label: parsed.label, score: parsed.score, reason: parsed.reason });
          await tmp.validate();
          return parsed;
        } catch (ve) {
          console.warn("[/chat] mood validation failed:", ve && (ve.errors || ve));
          return { label: "neutral", score: 3, reason: "validation_failed" };
        }
      } catch (e) {
        console.error("[/chat] mood classifier error:", e && (e.message || e));
        return { label: "neutral", score: 3, reason: "model_failed" };
      }
    })();

    // 2) save mood entry
    const entry = new MoodEntry({
      userId,
      date: new Date(),
      label: mood.label,
      score: mood.score,
      reason: mood.reason || "",
      message
    });
    await entry.save();

    // 3) fetch existing single previous summary string
    const prevDoc = await ConversationSummary.findOne({ userId }).lean();
    const previousSummary = prevDoc?.summary || "";

    // 4) determine consecutive sad + uplift
    const consecutiveSad = await getConsecutiveSadCount(userId);
    const isHappy = mood.score >= 4;
    const counterReset = isHappy && consecutiveSad === 0;

    // configurable thresholds (env override)
    const UPLIFT_THRESHOLD = parseInt(process.env.MOOD_THRESHOLD || "5", 10) || 5;
    const ACTIVITIES_THRESHOLD = parseInt(process.env.MOOD_ACTIVITIES_THRESHOLD || "7", 10) || 7;

    const shouldUplift = consecutiveSad >= UPLIFT_THRESHOLD;

    // detect suicidal language
    const isSuicidal = SUICIDAL_REGEX.test(String(message || ""));

    // debug log to help trace issues in server logs
    console.log(`[chat] user=${userId} consecutiveSad=${consecutiveSad} shouldUplift=${shouldUplift} isSuicidal=${isSuicidal} UPLIFT_THRESHOLD=${UPLIFT_THRESHOLD} ACTIVITIES_THRESHOLD=${ACTIVITIES_THRESHOLD}`);

    // 5) get assistant reply — pass previousSummary so assistant has memory
    const assistantReply = await getAssistantReply({ previousSummary, message, shouldUplift });

    // 6) if necessary, fetch recommendations
    let recommendations = null;
    if (shouldUplift || consecutiveSad >= ACTIVITIES_THRESHOLD || isSuicidal) {
      const [songs, quote, memes] = await Promise.all([fetchSongs(), fetchQuote(), fetchMemes()]);
      recommendations = { songs, quote, memes, consecutiveSad, message: `I've noticed ${consecutiveSad} consecutive negative moods. Here's some content that may help.` };

      // Use >= so hitting the threshold (e.g. 7) triggers activities
      if (consecutiveSad >= ACTIVITIES_THRESHOLD) {
        recommendations.activities = POSITIVE_ACTIVITIES;
      }

      if (isSuicidal) {
        recommendations.helplines = INDIA_HELPLINES;
      }
    }

    // 7) create updated single summary by merging previousSummary + new conversation
    const conversationText = `User message: ${message}\nMood: ${JSON.stringify(mood)}`;
    const updatedSummary = await createAndUpsertSingleSummary(userId, conversationText, previousSummary);

    // 8) prepare final reply text (small friendly additions)
    let finalReply = assistantReply;
    if (shouldUplift && recommendations) {
      finalReply = `${assistantReply}\n\n✨ I've noticed you've been feeling down for ${consecutiveSad} messages in a row. I've added a few things that might help.`;
    } else if (consecutiveSad >= ACTIVITIES_THRESHOLD && recommendations && recommendations.activities) {
      finalReply = `${assistantReply}\n\n✨ I also noticed a longer streak of low mood — here are a few positive activities you might try.`;
    } else if (isHappy && consecutiveSad === 0) {
      finalReply = `${assistantReply}\n\n🎉 I'm so glad you're feeling happy! Keep it up!`;
    }

    // 9) respond (include the single summary string so frontend or future calls can reuse)
    return res.json({
      reply: finalReply,
      mood,
      saved: true,
      consecutiveSad,
      recommendations,
      upliftSent: shouldUplift,
      counterReset,
      isHappy,
      conversationSummary: updatedSummary
    });

  } catch (err) {
    console.error("[/chat] ERROR:", err && (err.stack || err.message || err));
    return res.status(500).json({ error: "server error", details: String(err && (err.message || err)) });
  }
});

export default router;
