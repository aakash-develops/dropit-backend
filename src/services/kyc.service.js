import Kyc from "../models/kyc.model.js";
import { saveAndOptimizeImage } from "./image.service.js";

/**
 * Submit or update KYC details for logged-in driver
 */
export const submitKyc = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    // Parse JSON text payload if sent via multipart FormData, or fall back to standard req.body
    const bodyData = req.body.data ? JSON.parse(req.body.data) : req.body;
    const { nationalId, driverLicense, vehicleDetails, bankDetails, phoneNumber, route } = bodyData;

    const files = req.files || {};
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // Helper: Saves uploaded binary file via Sharp or keeps existing string URL
    const processImage = async (fileField, fallbackUrl) => {
      if (files[fileField] && files[fileField][0]) {
        const relativePath = await saveAndOptimizeImage(files[fileField][0].buffer, "kyc");
        return `${baseUrl}${relativePath}`;
      }
      return fallbackUrl;
    };

    // Compress & build full accessible WebP image URLs
    const selfieWithId = await processImage("selfieWithId", bodyData.selfieWithId);
    const frontImage = await processImage("licenseFront", driverLicense?.frontImage);
    const backImage = await processImage("licenseBack", driverLicense?.backImage);
    const bluebookImage = await processImage("bluebookImage", vehicleDetails?.bluebookImage);

    // Basic validation for essential documents
    if (!frontImage || !driverLicense?.licenseNumber) {
      return res.status(400).json({
        message: "Driver's license front image and license number are required.",
      });
    }

    if (!vehicleDetails?.vehicleNumber || !bluebookImage) {
      return res.status(400).json({
        message: "Vehicle license plate and bluebook registration image are required.",
      });
    }

    if (!selfieWithId) {
      return res.status(400).json({
        message: "Selfie holding your government ID is required.",
      });
    }

    // Upsert: Reset status to 'pending' upon new submission/resubmission
    const kycRecord = await Kyc.findOneAndUpdate(
      { userId },
      {
        userId,
        nationalId,
        selfieWithId,
        driverLicense: {
          ...driverLicense,
          expiresAt: driverLicense?.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          frontImage,
          backImage,
        },
        vehicleDetails: {
          ...vehicleDetails,
          bluebookImage,
        },
        bankDetails,
        phoneNumber,
        route,
        status: "pending",
        rejectionReason: "", // Clear old rejection message on resubmit
      },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      message: "KYC documents submitted successfully. Pending admin approval.",
      data: kycRecord,
    });
  } catch (error) {
    console.error("Error submitting KYC form:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Get KYC details/status for the logged-in user
 */
export const getMyKyc = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const kycRecord = await Kyc.findOne({ userId });

    if (!kycRecord) {
      return res.status(200).json({
        status: "unsubmitted",
        message: "No KYC submission found for this user.",
      });
    }

    return res.status(200).json(kycRecord);
  } catch (error) {
    console.error("Error fetching KYC status:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * ADMIN FUNCTION: Approve or Reject driver KYC
 */
export const updateKycStatus = async (req, res) => {
  try {
    const { kycId } = req.params;
    const { status, rejectionReason } = req.body;

    if (!["approved", "rejected", "action_required"].includes(status)) {
      return res.status(400).json({
        message: "Status must be 'approved', 'rejected', or 'action_required'.",
      });
    }

    const kycRecord = await Kyc.findById(kycId);
    if (!kycRecord) {
      return res.status(404).json({ message: "KYC record not found." });
    }

    kycRecord.status = status;
    if (status === "approved") {
      kycRecord.verifiedAt = new Date();
      kycRecord.rejectionReason = "";
    } else {
      kycRecord.rejectionReason = rejectionReason || "Documents failed verification check.";
    }

    await kycRecord.save();

    return res.status(200).json({
      message: `Driver KYC status updated to '${status}'.`,
      data: kycRecord,
    });
  } catch (error) {
    console.error("Error updating KYC status:", error);
    return res.status(500).json({ message: error.message });
  }
};