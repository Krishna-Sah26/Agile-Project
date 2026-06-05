import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({

  firebaseUID: {
    type: String,
    required: true
  },

  name: {
    type: String,
    default: ""
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  orgName: {
    type: String,
    required: true
  },

  orgType: {
    type: String,
    required: true
  },

  role: {
    type: String,
    default: "admin"
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
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

export default mongoose.model("User", UserSchema);
