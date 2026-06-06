import "../config/env.js";
import nodemailer from "nodemailer";

const emailUser = process.env.EMAIL_USER;
const emailAppPassword = process.env.EMAIL_APP_PASSWORD;
const emailFrom = process.env.EMAIL_FROM || (emailUser ? `CampusQ <${emailUser}>` : "CampusQ");

const transporter = emailUser && emailAppPassword
  ? nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: emailUser,
        pass: emailAppPassword
      },
      tls: {
        rejectUnauthorized: false
      }
    })
  : null;

if (transporter) {
  transporter.verify(function (error) {
    if (error) {
      console.log("Gmail transporter error:", error);
    } else {
      console.log("Gmail transporter ready");
    }
  });
} else {
  console.log("Email transporter not configured");
}

export const sendWelcomeEmail = async (toEmail, orgName) => {
  try {
    if (!transporter) {
      throw new Error("Email transporter is not configured");
    }

    const mailOptions = {
      from: emailFrom,
      to: toEmail,
      subject: "Welcome to CampusQ",
      html: `
        <h2>Welcome to CampusQ System</h2>
        <p>Hello ${orgName},</p>
        <p>You have successfully logged in.</p>
        <p>Welcome to CampusQ queue management system.</p>
        <br/>
        <b>CampusQ Team</b>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
  } catch (error) {
    console.log("Email Error:", error.message);
  }
};

export const sendStaffInviteEmail = async ({
  toEmail,
  name,
  role,
  tempPassword,
  loginUrl,
  orgName
}) => {
  try {
    if (!transporter) {
      throw new Error("Email transporter is not configured");
    }

    const mailOptions = {
      from: emailFrom,
      to: toEmail,
      subject: "Your CampusQ Staff Account Is Ready",
      html: `
        <h2>CampusQ Staff Account Created</h2>
        <p>Hello ${name},</p>
        <p>Your account has been created for <b>${orgName || "CampusQ"}</b>.</p>
        <p><b>Role:</b> ${role}</p>
        <p><b>Login Email:</b> ${toEmail}</p>
        <p><b>Temporary Password:</b> ${tempPassword}</p>
        <p>Please login and change your password immediately.</p>
        <p><a href="${loginUrl}" target="_blank">Click here to login</a></p>
        <br/>
        <b>CampusQ Team</b>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Staff invite email sent:", info.messageId);
  } catch (error) {
    console.log("Staff invite email error:", error.message);
  }
};
