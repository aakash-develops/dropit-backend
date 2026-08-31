import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
  address: { type: String, required: true },
  coordinates: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
});

const tripRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // GeoJSON Locations (For distance & map searching)
    pickUpLocation: { type: locationSchema },
    dropOffLocation: { type: locationSchema },

    // Fallback strings for existing app compatibility
    pickUp: { type: String, required: true, trim: true },
    dropOff: { type: String, required: true, trim: true },

    // Freight Details
    items: { type: String, required: true, trim: true },
    quantity: { type: Number, default: 1 },
    unit: { type: String, trim: true },
    weightKg: { type: Number, default: 0 },
    truckType: {
      type: String,
      enum: ["pickup", "van", "box_truck", "flatbed", "reefer", "container_trailer"],
      default: "pickup",
    },
    wheelers: { type: Number },

    // Pricing & Haggling
    price: { type: Number, required: true },         // Base / Initial offered price
    agreedPrice: { type: Number, default: null },   // Locked price after bid acceptance
    escrowStatus: {
  type: String,
  enum: ["unpaid", "locked", "released", "disputed", "refunded"],
  default: "locked",
  index: true,
},
platformFee: { type: Number, default: 0 },
driverEarnings: { type: Number, default: 0 },
    // Contact Numbers
    phoneNumber: { type: String, trim: true },
    driverPhone: { type: String, trim: true },

    // Freight Lifecycle Statuses
    status: {
      type: String,
      enum: [
        "pending",          // Bidding open
        "accepted",         // Rate locked / Driver assigned
        "en_route_pickup",  // Driver driving to shipper
        "arrived_pickup",   // Driver arrived at pickup
        "in_transit",       // On the road to delivery point
        "arrived_dropoff",  // Driver at dropoff
        "completed",        // Goods delivered + POD verified
        "cancelled"
      ],
      default: "pending",
      index: true,
    },

    // Security OTP & Proof of Delivery
    pickupOTP: { type: String },
    deliveryOTP: { type: String },
    proofOfDelivery: {
      photoUrl: { type: String },
      signatureUrl: { type: String },
      deliveredAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

// 2DSphere spatial index for finding nearby loads on driver feed
tripRequestSchema.index({ "pickUpLocation.coordinates": "2dsphere" });

const TripRequest = mongoose.model("TripRequest", tripRequestSchema);

export default TripRequest;