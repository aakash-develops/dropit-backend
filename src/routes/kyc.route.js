import express from "express";
import { getMyKyc, submitKyc, updateKycStatus } from "../services/kyc.service.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
const router = express.Router();

// Require JWT authentication for all KYC routes
router.use(verifyToken);

/**
 * @route   POST /api/kyc
 * @desc    Submit or update driver KYC details
 */
router.post(
  "/",
  upload.fields([
    { name: "selfieWithId", maxCount: 1 },
    { name: "licenseFront", maxCount: 1 },
    { name: "licenseBack", maxCount: 1 },
    { name: "bluebookImage", maxCount: 1 },
  ]),
  submitKyc
);

/**
 * @route   GET /api/kyc/my
 * @desc    Get logged-in user's KYC details & status
 */
router.get("/my", getMyKyc);

/**
 * @route   PUT /api/kyc/:kycId/status
 * @desc    Admin endpoint: Approve, reject, or request action on driver KYC
 */
router.put("/:kycId/status", updateKycStatus);

export default router;