import { sendEmailOtp } from "./email.service.js";
import { getRandomOtp } from "../utils/generate.otp.js";
import Otp from "../models/otp.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";

/**
 * Step 1: Request Password Reset OTP
 */
export const resetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email parameter is required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "No account found with this email." });
    }

  // Generate fresh OTP
const otp = getRandomOtp();
console.log(`🔑 GENERATED OTP FOR ${normalizedEmail}:`, otp); // Displays in terminal

// Send Email OTP
await sendEmailOtp(user.email, otp);

    // Wipe OLD OTPs ONLY for THIS user, then save new OTP
    await Otp.deleteMany({ email: normalizedEmail });
    await Otp.create({ otp, email: normalizedEmail });

    return res.status(200).json({ message: "OTP sent successfully to your email." });
  } catch (error) {
    console.error("Error sending reset password OTP:", error);
    return res.status(500).json({ message: "Internal server error.", error: error.message });
  }
};

/**
 * Step 2: Verify OTP
 */
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "Email does not exist." });
    }

    const otpDoc = await Otp.findOne({ email: normalizedEmail });
    if (!otpDoc) {
      return res.status(400).json({ message: "OTP request not found or has expired." });
    }

    // String conversion prevents type-mismatch bugs (e.g. "1234" vs 1234)
    const isOtpMatch = String(otp) === String(otpDoc.otp);

    if (!isOtpMatch) {
      // FIX: Added 'return' keyword to prevent code from executing further!
      return res.status(400).json({ message: "Incorrect OTP code." });
    }

    // Mark OTP as verified
    await Otp.updateOne({ email: normalizedEmail }, { $set: { isVerified: true } });

    return res.status(200).json({ message: "OTP verified successfully." });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ message: "Internal server error.", error: error.message });
  }
};

/**
 * Step 3: Change Password
 */
export const changePassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: "Email and newPassword are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const otpDoc = await Otp.findOne({ email: normalizedEmail });
    if (!otpDoc) {
      return res.status(400).json({ message: "Password reset session not found or expired." });
    }

    if (!otpDoc.isVerified) {
      return res.status(403).json({ message: "OTP has not been verified yet." });
    }

    // Hash the new password safely
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update User Password
    await User.updateOne(
      { email: normalizedEmail },
      { $set: { password: hashedPassword } }
    );

    // Clear consumed OTP record
    await Otp.deleteMany({ email: normalizedEmail });

    return res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    console.error("Error changing password:", error);
    return res.status(500).json({ message: "Internal server error.", error: error.message });
  }
};