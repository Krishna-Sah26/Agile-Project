
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({

  host: "smtp.gmail.com",

  port: 587,           // IMPORTANT

  secure: false,       // false for port 587

  auth: {

    user: "krishnakumarsah483@gmail.com",

    pass: "xcgmmwqeqkaafrmp"   // your app password

  },

  tls: {

    rejectUnauthorized: false

  }

});


// Test transporter
transporter.verify(function (error, success) {

  if (error) {

    console.log("❌ Gmail Transporter Error:", error);

  } else {

    console.log("✅ Gmail Transporter Ready");

  }

});


// Send welcome email
export const sendWelcomeEmail = async (toEmail, orgName) => {

  try {

    const mailOptions = {

      from: "CampusQ <krishnakumarsah483@gmail.com>",

      to: toEmail,

      subject: "Welcome to CampusQ 🎉",

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

    console.log("✅ Email sent:", info.messageId);

  }

  catch (error) {

    console.log("❌ Email Error:", error.message);

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
    const mailOptions = {
      from: "CampusQ <krishnakumarsah483@gmail.com>",
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
