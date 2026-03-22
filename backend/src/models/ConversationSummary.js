// backend/src/models/ConversationSummary.js
import mongoose from "mongoose";

const ConversationSummarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  summary: { type: String, default: "" }, // single string summary
  updatedAt: { type: Date, default: Date.now }
});

const ConversationSummary = mongoose.models.ConversationSummary ||
  mongoose.model("ConversationSummary", ConversationSummarySchema);

export default ConversationSummary;
