import express from "express";
import {
  estimatePrice,
  acceptRequest,
  createRequest,
  deleteRequest,
  getAllRequests,
  getMyRequests,
  getNearbyRequests,
  getRequestById,
  getMyDriverTrips,
  updateRequest,
  verifyOTP,
uploadPODPhoto,

} from "../services/make.request.service.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

// Apply JWT verification to all routes in this module
router.use(verifyToken);

/**
 * @route   POST /api/requests/estimate-price
 * @desc    Get real-time price estimate before creating a request
 * @note    Must stay ABOVE /:id routes
 */
router.post("/estimate-price", estimatePrice);

/**
 * @route   POST /api/requests
 * @desc    Create a new trip request
 */
router.post("/", createRequest);

/**
 * @route   GET /api/requests/my
 * @desc    Get all trip requests created by logged-in user
 * @note    Must stay ABOVE /:id so "my" isn't treated as an ID
 */
router.get("/my", getMyRequests);

/**
 * @route   GET /api/requests/nearby
 * @desc    Get nearby trip requests using geospatial coordinates (lng, lat)
 * @note    Must stay ABOVE /:id so "nearby" isn't treated as an ID
 */
router.get("/nearby", getNearbyRequests);

/**
 * @route   GET /api/requests/driver-trips
 * @desc    Get all active trips assigned to logged-in driver
 * @note    Must stay ABOVE /:id so "driver-trips" isn't treated as an ID
 */
router.get("/driver-trips", getMyDriverTrips);

/**
 * @route   GET /api/requests
 * @desc    Get all trip requests (Feed view for drivers)
 */
router.get("/", getAllRequests);

/**
 * @route   GET /api/requests/:id
 * @desc    Get a specific trip request by MongoDB ID
 */
router.get("/:id", getRequestById);

/**
 * @route   PUT /api/requests/:id
 * @desc    Update trip request by MongoDB ID
 */
router.put("/:id", updateRequest);

/**
 * @route   PUT /api/requests/:id/accept
 * @desc    Accept a trip request by MongoDB ID
 */
router.put("/:id/accept", acceptRequest);

/**
 * @route   POST /api/requests/:id/verify-otp
 * @desc    Verify Pickup or Delivery OTP code
 */
router.post("/:id/verify-otp", verifyOTP);

/**
 * @route   POST /api/requests/:id/pod
 * @desc    Upload Proof of Delivery cargo photo
 */
router.post("/:id/pod", upload.single("photo"), uploadPODPhoto);

/**
 * @route   DELETE /api/requests/:id
 * @desc    Delete a trip request by MongoDB ID
 */
router.delete("/:id", deleteRequest);

export default router;