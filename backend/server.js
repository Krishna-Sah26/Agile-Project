import "./config/env.js";
import { sendWelcomeEmail, sendStaffInviteEmail } from "./utils/sendEmail.js";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import http from "http"; // ADDED: http server for socket.io
import { Server } from "socket.io"; // ADDED: socket.io server
import authRoutes from "./routes/auth.js";
import User from "./models/User.js";
import Staff from "./models/Staff.js";
import queueRoutes from "./routes/queueRoutes.js";
import adminRoutes from "./routes/adminRoutes.js"; // ADDED: admin routes
import dashboardRoutes from "./routes/dashboardRoutes.js"; // ADDED: dashboard stats routes

const app = express();
const server = http.createServer(app); // ADDED: create HTTP server
const io = new Server(server, {
  cors: {
    origin: "*"
  }
}); // ADDED: socket.io init

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ADDED: join room by queueId for scoped updates
  socket.on("joinQueueRoom", (queueId) => {
    if (queueId) {
      socket.join(`queue:${queueId}`);
    }
  });

  // ADDED: leave room by queueId
  socket.on("leaveQueueRoom", (queueId) => {
    if (queueId) {
      socket.leave(`queue:${queueId}`);
    }
  });
}); // ADDED: socket connection log

app.set("io", io); // ADDED: make io available in routes/controllers

// middleware
app.use(cors()); // allow frontend (5173)
app.use(express.json());
app.use("/api", authRoutes);
app.use("/api/queue", queueRoutes); // ADDED: QR queue route mount
app.use("/api/admin", adminRoutes); // ADDED: admin queue routes
app.use("/api/dashboard", dashboardRoutes); // ADDED: dashboard stats


const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error("Missing MONGODB_URI in backend/.env");
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(" MongoDB Error:", err.message));

// ADDED: drop old global token unique index (if it exists)
mongoose.connection.on("open", async () => {
  try {
    const tokensCollection = mongoose.connection.collection("tokens");
    const indexes = await tokensCollection.indexes();
    for (const idx of indexes) {
      const key = idx?.key || {};
      if (key.token === 1 && Object.keys(key).length === 1) {
        await tokensCollection.dropIndex(idx.name);
        console.log("✅ Dropped old token index:", idx.name);
      }
    }
  } catch (error) {
    console.log("⚠️ Token index cleanup skipped:", error.message);
  }
});

// test route
app.get("/", (req, res) => {
  res.send("CampusQ Backend Running");
});
// Register API
app.post("/api/register", async (req, res) => {
  try {
    console.log("Incoming Register Data:", req.body);

    const { firebaseUID, email, orgName, orgType } = req.body;

    if (!firebaseUID || !email || !orgName || !orgType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // prevent duplicate emails
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const user = new User({ firebaseUID, email, orgName, orgType });
    await user.save();

    console.log("✅ Saved to MongoDB");

    res.json({ success: true, message: "User saved successfully" });
  } catch (error) {
    console.log("❌ Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// server start
const PORT = process.env.PORT || 5000;

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the other process or set a different PORT in backend/.env.`);
  } else {
    console.error("Server error:", error);
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


//  heya hai email send karne wali api login ke time par, jab user login karega to usko email chala jayega ki apka account successfully login ho gaya hai, aur ab aap queues manage kar sakte ho.


app.post("/api/login", async (req, res) => {

  try {

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {

      return res.json({

        success: false,

        message: "User not found"

      });

    }

    // ✅ SEND EMAIL HERE
    await sendWelcomeEmail(user.email, user.orgName);

    res.json({

      success: true,

      user

    });

  }

  catch (error) {

    console.log("Login error:", error);

    res.json({

      success: false,

      message: "Server error"

    });

  }

});



app.post("/api/create-staff", async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    orgName,
    orgType,
    phone,
    department,
    createdBy
  } = req.body;

  try {
    if (!name || !email || !password || !role || !orgName || !orgType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    if (!["staff", "supervisor"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role"
      });
    }

    // ADDED: phone validation (optional, but if sent it must be 10 digits)
    const cleanPhone = typeof phone === "string" ? phone.trim() : "";
    if (cleanPhone && !/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: "Phone must be exactly 10 digits"
      });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email"
      });
    }

    const firebaseApiKey = process.env.FIREBASE_API_KEY;

    if (!firebaseApiKey) {
      return res.status(500).json({
        success: false,
        message: "FIREBASE_API_KEY is not configured"
      });
    }

    const firebaseResp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true
        })
      }
    );

    const firebaseData = await firebaseResp.json();

    if (!firebaseResp.ok) {
      const firebaseMessage = firebaseData?.error?.message || "Firebase user create failed";
      return res.status(400).json({
        success: false,
        message: firebaseMessage
      });
    }

    const staffUser = new User({
      firebaseUID: firebaseData.localId,
      name,
      email,
      orgName,
      orgType,
      role,
      phone: cleanPhone,
      department: department || "",
      createdBy: createdBy || ""
    });

    await staffUser.save();

    const staffProfile = new Staff({
      firebaseUID: firebaseData.localId,
      name,
      email,
      role,
      orgName,
      orgType,
      phone: cleanPhone,
      department: department || "",
      createdBy: createdBy || ""
    });

    await staffProfile.save();

    await sendStaffInviteEmail({
      toEmail: email,
      name,
      role,
      tempPassword: password,
      loginUrl: "http://localhost:5173/staff-login",
      orgName
    });

    return res.json({
      success: true,
      message: "Staff account created and invite email sent",
      user: staffUser
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});








