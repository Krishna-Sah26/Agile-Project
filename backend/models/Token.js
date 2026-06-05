import mongoose from "mongoose";

// ADDED: token schema for queue entries (collection: tokens)
const tokenSchema = new mongoose.Schema(
  {
    queueId: { type: String, required: true, trim: true },
    token: { type: String, required: true, trim: true },
    tokenNumber: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["waiting", "serving", "completed", "cancelled"],
      default: "waiting"
    }
  },
  { timestamps: true }
);

// ADDED: unique per-queue token sequence
tokenSchema.index({ queueId: 1, tokenNumber: 1 }, { unique: true });

// ADDED: force exact MongoDB collection name = tokens
const Token = mongoose.model("Token", tokenSchema, "tokens");
export default Token;
