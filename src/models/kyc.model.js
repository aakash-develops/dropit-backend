import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    frontImage: { type: String, required: true },
    backImage: { type: String }, // Optional for documents with a back side
    documentNumber: { type: String, trim: true },
    expiresAt: { type: Date },
  },
  { _id: false }
);

const kycSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One KYC record per driver
      index: true,
    },

    // 1. Verification Lifecycle Status
    status: {
      type: String,
      enum: ["unsubmitted", "pending", "approved", "rejected", "action_required"],
      default: "pending",
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: "", // Admin feedback if rejected (e.g. "License image is blurry")
    },
    verifiedAt: {
      type: Date,
      default: null,
    },

    // 2. Personal & Identity Verification
    nationalId: documentSchema, // Citizenship / Passport / Govt ID
    selfieWithId: { type: String, required: true }, // Anti-fraud selfie check

    // 3. Driver's License Details
    driverLicense: {
      frontImage: { type: String, required: true },
      backImage: { type: String },
      licenseNumber: { type: String, required: true, trim: true, uppercase: true },
      expiresAt: { type: Date, required: true },
    },

    // 4. Vehicle & Fleet Info
    vehicleDetails: {
      vehicleType: {
        type: String,
        enum: ["pickup", "van", "box_truck", "flatbed", "reefer", "container_trailer"],
        required: true,
      },
      vehicleNumber: { type: String, required: true, trim: true, uppercase: true }, // License Plate
      maxWeightCapacityKg: { type: Number, required: true, default: 1000 },
      bluebookImage: { type: String, required: true }, // Vehicle Registration / Ownership doc
      insuranceImage: { type: String },               // Commercial Vehicle Insurance
      insuranceExpiresAt: { type: Date },
    },

    // 5. Driver Payout / Bank Details (Needed to transfer earnings)
    bankDetails: {
      accountHolderName: { type: String, trim: true },
      bankName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      routingNumberOrIFSC: { type: String, trim: true },
    },

    // Legacy fallbacks for backward compatibility
    phoneNumber: { type: String, trim: true },
    route: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

const Kyc = mongoose.model("Kyc", kycSchema);

export default Kyc;