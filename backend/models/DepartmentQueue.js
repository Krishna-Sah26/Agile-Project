import mongoose from "mongoose";

// ADDED: department queue schema for admin-created queues
const departmentQueueSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    organization: { type: String, default: "" },
    queueId: { type: String, unique: true, required: true, trim: true },
    status: {
      type: String,
      enum: ["open", "paused", "closed"],
      default: "open"
    },
    avgServiceTime: { type: Number, default: 5 }
  },
  { timestamps: true }
);

// ADDED: force exact MongoDB collection name = DepartmentQueue (matches Compass)
const DepartmentQueue = mongoose.model("DepartmentQueue", departmentQueueSchema, "DepartmentQueue");
export default DepartmentQueue;
