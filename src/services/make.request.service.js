import TripRequest from "../models/make.request.model.js";
import { calculateBasePrice } from "../utils/price.calculator.js";
import { saveAndOptimizeImage } from "./image.service.js";
/**
 * 0. REAL-TIME PRICE ESTIMATOR (For Frontend App)
 */
export const estimatePrice = async (req, res) => {
  try {
    const { truckType, distanceKm, weightKg } = req.body;

    const resolvedTruck = truckType || "pickup";
    const parsedDistance = parseFloat(distanceKm) || 0;
    const parsedWeight = parseFloat(weightKg) || 0;

    const minPrice = calculateBasePrice(
      resolvedTruck,
      parsedDistance,
      parsedWeight
    );

    return res.status(200).json({
      success: true,
      minPrice,
      truckType: resolvedTruck,
      distanceKm: parsedDistance,
      weightKg: parsedWeight,
    });
  } catch (error) {
    console.error("Error calculating price estimate:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * 1. Create a new freight trip request
 */
export const createRequest = async (req, res) => {
  try {
    const {
      pickUp,
      dropOff,
      phoneNumber,
      price,
      items,
      quantity,
      unit,
      weightKg,
      truckType,
      pickUpCoords,   // [longitude, latitude]
      dropOffCoords,  // [longitude, latitude]
      distanceKm,     // driving distance from map
    } = req.body;

    if (!pickUp || !dropOff || !phoneNumber || !items || !price) {
      return res.status(400).json({
        message: "pickUp, dropOff, phoneNumber, items, and price are required.",
      });
    }

    const resolvedTruckType = truckType || "pickup";

    // Enforce Base Floor Price Protection
    if (distanceKm) {
      const minPrice = calculateBasePrice(resolvedTruckType, distanceKm, weightKg || 0);
      if (price < minPrice) {
        return res.status(400).json({
          message: `Offered price ($${price}) is below the minimum fair rate ($${minPrice}) for a ${resolvedTruckType} over ${distanceKm}km.`,
          minAllowedPrice: minPrice,
        });
      }
    }

    // Build GeoJSON structures if coordinates provided
    const pickUpLocation = pickUpCoords
      ? { address: pickUp, coordinates: { type: "Point", coordinates: pickUpCoords } }
      : undefined;

    const dropOffLocation = dropOffCoords
      ? { address: dropOff, coordinates: { type: "Point", coordinates: dropOffCoords } }
      : undefined;

    // Save request (including distanceKm)
    const createdRequest = await TripRequest.create({
      pickUp,
      dropOff,
      pickUpLocation,
      dropOffLocation,
      phoneNumber,
      price,
      items,
      quantity,
      unit,
      weightKg,
      distanceKm: distanceKm || 0,
      truckType: resolvedTruckType,
      userId: req.user.id || req.user._id,
    });

    return res.status(201).json({
      message: "Trip request created successfully.",
      data: createdRequest,
    });
  } catch (error) {
    console.error("Error creating trip request:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Get requests created by the logged-in client
 */
export const getMyRequests = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const myRequests = await TripRequest.find({ userId }).sort({ createdAt: -1 });
    return res.status(200).json(myRequests);
  } catch (error) {
    console.error("Error fetching user requests:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Get all open requests (For driver feed)
 */
export const getAllRequests = async (req, res) => {
  try {
    const allRequests = await TripRequest.find({ status: "pending" }).sort({ createdAt: -1 });
    return res.status(200).json(allRequests);
  } catch (error) {
    console.error("Error fetching trip requests:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Spatial query: Get nearby requests within maxDistance (meters) for drivers
 */
export const getNearbyRequests = async (req, res) => {
  try {
    const { lng, lat, maxDistance = 50000 } = req.query; // default 50km

    if (!lng || !lat) {
      return res.status(400).json({ message: "lng and lat query parameters are required." });
    }

    const nearbyRequests = await TripRequest.find({
      status: "pending",
      "pickUpLocation.coordinates": {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(maxDistance),
        },
      },
    });

    return res.status(200).json(nearbyRequests);
  } catch (error) {
    console.error("Error fetching nearby requests:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Get single request by ID
 */
export const getRequestById = async (req, res) => {
  try {
    const request = await TripRequest.findById(req.params.id)
      .populate("userId", "fullName name email phoneNumber")
      .populate("driverId", "fullName name email phoneNumber");

    if (!request) {
      return res.status(404).json({ message: "Request not found." });
    }
    return res.status(200).json(request);
  } catch (error) {
    console.error("Error fetching request by ID:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Update freight request details
 */
export const updateRequest = async (req, res) => {
  try {
    const updatedRequest = await TripRequest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ message: "Request not found." });
    }

    return res.status(200).json({
      message: "Request updated successfully.",
      data: updatedRequest,
    });
  } catch (error) {
    console.error("Error updating request:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Accept a trip request directly (Direct acceptance without haggling)
 */
export const acceptRequest = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const request = await TripRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found." });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "This trip request is no longer pending." });
    }

    request.status = "accepted";
    request.driverId = userId;
    request.driverPhone = req.user.phoneNumber || request.driverPhone;
    request.agreedPrice = request.price; // Lock agreed price to initial price

    await request.save();

    return res.status(200).json({
      message: "Trip request accepted directly.",
      data: request,
    });
  } catch (error) {
    console.error("Error accepting request:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Verify pickup or delivery OTP
 */
/**
 * Verify pickup or delivery OTP with Secure Escrow Release
 */
export const verifyOTP = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp, type } = req.body; // type: 'pickup' or 'delivery'

    const request = await TripRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Trip request not found." });
    }

    if (type === "pickup") {
      if (request.pickupOTP !== otp) {
        return res.status(400).json({ message: "Invalid Pickup OTP." });
      }
      request.status = "in_transit";
      await request.save();

      return res.status(200).json({
        message: "PICKUP OTP verified successfully!",
        status: request.status,
      });
    } else if (type === "delivery") {
      // Guard: POD photo must exist
      if (!request.proofOfDelivery?.photoUrl) {
        return res.status(400).json({
          message: "POD Cargo Photo must be uploaded before entering delivery OTP.",
        });
      }

      // Guard: OTP Check
      if (request.deliveryOTP !== otp) {
        return res.status(400).json({ message: "Invalid Delivery OTP." });
      }

      // Financial Calculation (10% platform fee, 90% net driver payout)
      const grossAmount = request.agreedPrice || request.price || 0;
      const platformFee = Number((grossAmount * 0.10).toFixed(2));
      const driverEarnings = Number((grossAmount - platformFee).toFixed(2));

      // Atomic Update: Prevents duplicate escrow releases or race conditions
      const updatedTrip = await TripRequest.findOneAndUpdate(
        {
          _id: id,
          status: { $ne: "completed" },
          escrowStatus: { $ne: "released" },
        },
        {
          $set: {
            status: "completed",
            escrowStatus: "released",
            platformFee,
            driverEarnings,
            "proofOfDelivery.deliveredAt": new Date(),
          },
        },
        { new: true }
      );

      if (!updatedTrip) {
        return res.status(400).json({
          message: "Trip is already completed or escrow funds have already been released.",
        });
      }

      return res.status(200).json({
        message: "DELIVERY OTP verified and escrow balance released successfully!",
        status: updatedTrip.status,
        driverEarnings,
      });
    } else {
      return res.status(400).json({ message: "Type must be 'pickup' or 'delivery'." });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Delete request by ID
 */
export const deleteRequest = async (req, res) => {
  try {
    const deletedRequest = await TripRequest.findByIdAndDelete(req.params.id);

    if (!deletedRequest) {
      return res.status(404).json({ message: "Request not found." });
    }

    return res.status(200).json({ message: "Request deleted successfully." });
  } catch (error) {
    console.error("Error deleting request:", error);
    return res.status(500).json({ message: error.message });
  }
};
/**
 * Get active trips assigned specifically to the logged-in driver
 */
export const getMyDriverTrips = async (req, res) => {
  try {
    const driverId = req.user.id || req.user._id;

    // Fetch loads where driverId matches the logged-in driver and status is active
    const activeTrips = await TripRequest.find({
      driverId: driverId,
      status: { $in: ["accepted", "en_route_pickup", "arrived_pickup", "in_transit", "arrived_dropoff"] }
    }).sort({ updatedAt: -1 });

    return res.status(200).json(activeTrips);
  } catch (error) {
    console.error("Error fetching driver active trips:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Upload Proof of Delivery Cargo Photo
 */
export const uploadPODPhoto = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "Cargo photo is required." });
    }

    const request = await TripRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Trip request not found." });
    }

    // Save and optimize cargo photo under /uploads/pod/
    const photoUrl = await saveAndOptimizeImage(req.file.buffer, "pod");

    // Store photo URL in MongoDB subdocument
    request.proofOfDelivery = {
      ...request.proofOfDelivery,
      photoUrl,
    };

    await request.save();

    return res.status(200).json({
      message: "Proof of Delivery photo uploaded successfully.",
      photoUrl,
      request,
    });
  } catch (error) {
    console.error("Error uploading POD photo:", error);
    return res.status(500).json({ message: error.message });
  }
};