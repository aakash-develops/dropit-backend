import express from "express";
import {
  getMyPayments,
  getPaymentById,
  payIt,
  updatePaymentStatus,
  getDriverWallet,
} from "../services/pay.service.js";
import {
  createPaytrailPayment,
  handlePaytrailCallback,
} from "../services/paytrail.service.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ------------------------------------------------------------------
// PUBLIC WEBHOOK & REDIRECT ROUTES (No JWT required for Paytrail servers)
// ------------------------------------------------------------------
router.all("/paytrail/callback", handlePaytrailCallback);
router.all("/paytrail/success", (req, res) =>
  res.send("Payment successful! You can return to the DropIt app.")
);
router.all("/paytrail/cancel", (req, res) =>
  res.send("Payment was cancelled. You can return to the DropIt app.")
);

// ------------------------------------------------------------------
// PROTECTED ROUTES (Require JWT Authentication)
// ------------------------------------------------------------------
router.use(verifyToken);

/**
 * @route   POST /api/payments/paytrail/create
 * @desc    Generate Paytrail Checkout URL for Shipper (Bank / MobilePay)
 */
router.post("/paytrail/create", createPaytrailPayment);

/**
 * @route   GET /api/payments/wallet/driver
 * @desc    Get driver wallet summary (Pending Escrow & Available Earnings)
 */
router.get("/wallet/driver", getDriverWallet);

/**
 * @route   POST /api/payments
 * @desc    Create a new payment record
 */
router.post("/", payIt);

/**
 * @route   GET /api/payments/my
 * @desc    Get all payment records for logged-in user
 */
router.get("/my", getMyPayments);

/**
 * @route   GET /api/payments/:id
 * @desc    Get payment by MongoDB ID
 */
router.get("/:id", getPaymentById);

/**
 * @route   PUT /api/payments/:id/status
 * @desc    Update payment status (pending -> completed / failed)
 */
router.put("/:id/status", updatePaymentStatus);

export default router;