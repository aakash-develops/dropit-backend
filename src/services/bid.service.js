import Bid from "../models/bid.model.js";
import TripRequest from "../models/make.request.model.js";

const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

/**
 * Submit a new bid / counter-offer
 */
export const createBid = async (req, res) => {
  try {
    const { requestId, offeredPrice, notes, senderRole: bodyRole } = req.body;
    const userId = req.user.id || req.user._id;

    // 1. Resolve role directly from body, req.user.role, or array
    let rawRole = bodyRole || req.user.role || (Array.isArray(req.user.roles) ? req.user.roles[0] : req.user.roles);

    // Ensure rawRole is a string before evaluating
    rawRole = String(rawRole || '').toLowerCase().trim();

    // 2. Strict Enum Mapping to "driver" | "client"
    let userRole = "driver"; // safe fallback
    if (rawRole.includes("client") || rawRole.includes("user") || rawRole.startsWith("u") || rawRole.startsWith("c")) {
      userRole = "client";
    } else if (rawRole.includes("driver") || rawRole.startsWith("d")) {
      userRole = "driver";
    }

    // 1. Verify trip request exists and is open for bidding
    const tripRequest = await TripRequest.findById(requestId);
    if (!tripRequest) {
      return res.status(404).json({ message: "Trip request not found." });
    }

    if (tripRequest.status !== "pending") {
      return res.status(400).json({
        message: "This trip request is no longer open for bidding.",
      });
    }

    // 2. Fetch existing bids for turn verification
    const existingBids = await Bid.find({ requestId }).sort({ createdAt: 1 });
    const userBids = existingBids.filter(b => b.senderId.toString() === userId.toString());

    // Enforce maximum 2 rounds per driver
    if (userRole === "driver" && userBids.length >= 2) {
      return res.status(400).json({
        message: "Maximum 2 counter-offer rounds reached for this load.",
      });
    }

    // Enforce turn-taking: can't counter if the very last bid was sent by yourself
    if (existingBids.length > 0) {
      const latestBid = existingBids[existingBids.length - 1];
      if (latestBid.senderId.toString() === userId.toString() && latestBid.status === "pending") {
        return res.status(400).json({
          message: "Please wait for the other party to respond to your active offer.",
        });
      }
    }

    // 3. Mark previous pending bids from this sender as 'countered'
    await Bid.updateMany(
      { requestId, senderId: userId, status: "pending" },
      { status: "countered" }
    );

    // 4. Create new bid record
    const newBid = await Bid.create({
      requestId,
      senderId: userId,
      senderRole: userRole, // Guaranteed to be strictly 'driver' or 'client'
      offeredPrice,
      notes,
      round: userBids.length + 1,
    });

    return res.status(201).json({
      message: "Bid counter-offer submitted successfully.",
      data: newBid,
    });
  } catch (error) {
    console.error("Error creating bid:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Get all bids for a specific trip request
 */
export const getBidsByRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const bids = await Bid.find({ requestId })
      .populate("senderId", "firstName lastName fullName email phoneNumber role company")
      .sort({ createdAt: 1 }); // Sort chronologically (oldest to newest) for history view

    return res.status(200).json(bids);
  } catch (error) {
    console.error("Error fetching bids:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Accept a bid (Locks contract & assigns driver)
 */
export const acceptBid = async (req, res) => {
  try {
    const { bidId } = req.params;

    const bid = await Bid.findById(bidId);
    if (!bid) {
      return res.status(404).json({ message: "Bid not found." });
    }

    if (bid.status !== "pending") {
      return res.status(400).json({ message: "This bid is no longer active." });
    }

    const tripRequest = await TripRequest.findById(bid.requestId);
    if (!tripRequest) {
      return res.status(404).json({ message: "Associated trip request not found." });
    }

    const pickupOTP = generateOTP();
    const deliveryOTP = generateOTP();

    tripRequest.status = "accepted";
    tripRequest.agreedPrice = bid.offeredPrice;

    // Assign driver correctly
    if (bid.senderRole === "driver") {
      tripRequest.driverId = bid.senderId;
    } else {
      tripRequest.driverId = req.user.id || req.user._id;
    }

    tripRequest.pickupOTP = pickupOTP;
    tripRequest.deliveryOTP = deliveryOTP;
    await tripRequest.save();

    bid.status = "accepted";
    await bid.save();

    await Bid.updateMany(
      { requestId: bid.requestId, _id: { $ne: bid._id } },
      { status: "rejected" }
    );

    return res.status(200).json({
      message: "Bid accepted and rate locked successfully!",
      data: {
        tripRequest,
        pickupOTP,
        deliveryOTP,
      },
    });
  } catch (error) {
    console.error("Error accepting bid:", error);
    return res.status(500).json({ message: error.message });
  }
};