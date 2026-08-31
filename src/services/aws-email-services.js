// 1. Updated relative paths according to directory structure
import { sendEmail } from "../config/aws-ses.js";
import { getRandomOtp } from "../utils/generate.otp.js";
import Otp from "../models/otp.model.js";
import User from "../models/user.model.js";

/**
 * Generates and dispatches a verification OTP via AWS SES
 */
export const awsEmail = async (req, res) => {
  const { to } = req.body;

  // 2. Input Validation
  if (!to) {
    return res.status(400).json({ message: "Recipient email parameter 'to' is required." });
  }

  try {
    // 3. Verify user exists in system
    const checkEmail = await User.findOne({ email: to.toLowerCase().trim() });

    if (!checkEmail) {
      return res.status(404).json({ message: "User with given email does not exist." });
    }

    // 4. Generate OTP & Email content
    const otp = getRandomOtp();
    const subject = "Your Verification Code";
    const body = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Bhariya Transport Verification</h2>
        <p>Your one-time password (OTP) for verification is:</p>
        <h1 style="color: #007bff; letter-spacing: 2px;">${otp}</h1>
        <p>This code will expire in 5 minutes. If you did not request this code, please ignore this email.</p>
      </div>
    `;

    // 5. Send Email via AWS SES
    await sendEmail(to, subject, body);

    // 6. Delete OLD OTPs ONLY for THIS specific email, then save new OTP
    await Otp.deleteMany({ email: to.toLowerCase().trim() });
    await Otp.create({ otp, email: to.toLowerCase().trim() });

    return res.status(200).json({ message: "OTP sent successfully." });

  } catch (error) {
    console.error("Error in awsEmail service:", error);
    return res.status(500).json({ message: "Error sending email.", error: error.message });
  }
};