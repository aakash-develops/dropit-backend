import Payment from "../models/pay.model.js";
import TripRequest from "../models/make.request.model.js";

/**
 * Creates and logs a new payment transaction record
 */
export const payIt = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { amount, orderId, userName, merchantId, returnUrl } = req.body;

    if (!amount || !orderId || !merchantId) {
      return res.status(400).json({
        message: "Missing required payment fields: 'amount', 'orderId', and 'merchantId' are required.",
      });
    }

    const createdPayment = await Payment.create({
      userId,
      amount,
      orderId,
      userName,
      merchantId,
      returnUrl,
      status: "pending",
    });

    return res.status(201).json({
      message: "Payment record created successfully.",
      data: createdPayment,
    });
  } catch (error) {
    console.error("Error logging payment:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Fetch all payments created by logged-in user
 */
export const getMyPayments = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const payments = await Payment.find({ userId }).sort({ createdAt: -1 });

    return res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching user payments:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Fetch a single payment by MongoDB ID
 */
export const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: "Payment transaction not found." });
    }

    return res.status(200).json(payment);
  } catch (error) {
    console.error("Error fetching payment:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Update payment status (completed / failed)
 */
export const updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "completed", "failed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value. Must be 'pending', 'completed', or 'failed'." });
    }

    const updatedPayment = await Payment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedPayment) {
      return res.status(404).json({ message: "Payment transaction not found." });
    }

    return res.status(200).json({
      message: `Payment status updated to ${status}.`,
      data: updatedPayment,
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Fetch wallet summary for the logged-in driver (Pending Escrow + Released Earnings)
 */
export const getDriverWallet = async (req, res) => {
  try {
    const driverId = req.user.id || req.user._id;

    // Fetch all trips assigned to this driver
    const trips = await TripRequest.find({ driverId }).sort({ updatedAt: -1 });

    let pendingEscrow = 0;
    let availableBalance = 0;
    let totalCompletedTrips = 0;

    trips.forEach((trip) => {
      const gross = trip.agreedPrice || trip.price || 0;
      const net = trip.driverEarnings || Number((gross * 0.90).toFixed(2));

      if (trip.escrowStatus === "released" || trip.status === "completed") {
        availableBalance += net;
        totalCompletedTrips += 1;
      } else if (trip.escrowStatus === "locked" && trip.status !== "completed" && trip.status !== "cancelled") {
        pendingEscrow += net;
      }
    });

    return res.status(200).json({
      success: true,
      wallet: {
        pendingEscrow: Number(pendingEscrow.toFixed(2)),
        availableBalance: Number(availableBalance.toFixed(2)),
        totalCompletedTrips,
        history: trips,
      },
    });
  } catch (error) {
    console.error("Error fetching driver wallet:", error);
    return res.status(500).json({ message: error.message });
  }
};