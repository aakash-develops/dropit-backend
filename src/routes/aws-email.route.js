import express from "express";
// 1. Correct import path stepping up to ../services/
import { awsEmail } from "../services/aws-email-services.js";

const router = express.Router();

/**
 * @route   POST /api/aws-email/send
 * @desc    Send OTP/notification email via AWS SES
 * @access  Public
 */
router.post("/send", awsEmail);

export default router;