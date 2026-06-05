import mongoose from "mongoose";

const StaffSchema = new mongoose.Schema(
  {
    firebaseUID: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    role: {
      type: String,
      enum: ["staff", "supervisor"],
      required: true
    },
    orgName: {
      type: String,
      required: true
    },
    orgType: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      default: ""
    },
    department: {
      type: String,
      default: ""
    },
    createdBy: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true,
    collection: "staff"
  }
);

// ADDED: force exact MongoDB collection name = staff
export default mongoose.model("Staff", StaffSchema, "staff");
