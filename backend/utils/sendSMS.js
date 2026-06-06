import "../config/env.js";
import twilio from "twilio";

const {
  TWILIO_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE
} = process.env;

let client = null;
if (TWILIO_SID && TWILIO_AUTH_TOKEN) {
  client = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);
}

const sendSMS = async (to, message) => {
  if (!client || !TWILIO_PHONE || !to) {
    return {
      success: false,
      error: "SMS config missing or invalid recipient"
    };
  }
  try {
    await client.messages.create({
      body: message,
      from: TWILIO_PHONE,
      to
    });
    return { success: true };
  } catch (err) {
    console.log("SMS Error:", err.message);
    return { success: false, error: err.message };
  }
};

export default sendSMS;
