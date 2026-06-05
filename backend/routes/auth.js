import express from "express";
import User from "../models/User.js";
import { sendWelcomeEmail } from "../utils/sendEmail.js";

const router = express.Router();

// LOGIN API
// router.post("/login", async (req, res) => {
//   try {
//     const { email } = req.body;
   

//     // check user exists
//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         message: "User not found"
//       });
//     }

//     // Send welcome email
//     try {
//       await sendWelcomeEmail(user.email, user.orgName);
//     } catch (emailError) {
//       console.log("⚠️ Email sending failed:", emailError.message);
//     }

//     res.json({
//       success: true,
//       message: "Login successful",
//       user: user
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// });

export default router;