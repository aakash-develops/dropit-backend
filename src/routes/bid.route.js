import express from "express";
import {
  createBid,
  getBidsByRequest,
  acceptBid,
} from "../services/bid.service.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Apply JWT verification to all bidding routes
router.use(verifyToken);

/**
 * @route   POST /api/bids
 * @desc    Submit a new bid / counter-offer (Driver or Client)
 */
router.post("/", createBid);

/**
 * @route   GET /api/bids/request/:requestId
 * @desc    Get all counter-offers for a specific trip request
 */
router.get("/request/:requestId", getBidsByRequest);

/**
 * @route   PUT /api/bids/:bidId/accept
 * @desc    Accept a bid (Locks contract rate & generates OTPs)
 */
router.put("/:bidId/accept", acceptBid);

export default router;