import express from "express";
import {
  changePassword,
  resetPassword,
  verifyOtp,
} from "../services/password.reset.service.js";

const router = express.Router();

/**
 * @route   POST /api/auth/reset-password
 * @desc    Step 1: Request password reset OTP email
 * @access  Public
 */
router.post("/reset-password", resetPassword);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Step 2: Verify submitted OTP code
 * @access  Public
 */
router.post("/verify-otp", verifyOtp);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Step 3: Update password after OTP verification
 * @access  Public
 */
router.put("/change-password", changePassword);


export default router;