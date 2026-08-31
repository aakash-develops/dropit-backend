import crypto from "crypto";
import axios from "axios";
import TripRequest from "../models/make.request.model.js";

// Paytrail Test Merchant Credentials
const MERCHANT_ID = process.env.PAYTRAIL_MERCHANT_ID || "375917";
const SECRET_KEY = process.env.PAYTRAIL_SECRET_KEY || "SAHALA";
const PAYTRAIL_API_URL = "https://paytrail.payment-api.net/payments";

/**
 * Calculates HMAC-SHA256 signature for Paytrail requests
 */
const calculateHmac = (secret, params, body = "") => {
  const hmacPayload = Object.keys(params)
    .sort()
    .map((key) => `${key}:${params[key]}`)
    .concat(body ? JSON.stringify(body) : "")
    .join("\n");

  return crypto
    .createHmac("sha256", secret)
    .update(hmacPayload)
    .digest("hex");
};

/**
 * Creates a Paytrail payment session and returns the checkout URL for Finnish Banks / MobilePay
 */
export const createPaytrailPayment = async (req, res) => {
  try {
    const { tripId } = req.body;
    const userId = req.user.id || req.user._id;

    const trip = await TripRequest.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: "Trip request not found." });
    }

    const amountInEuros = trip.agreedPrice || trip.price;
    const amountInCents = Math.round(amountInEuros * 100); // Paytrail uses cents

    const stamp = `TRIP_${trip._id}_${Date.now()}`;
    const nonce = crypto.randomBytes(16).toString("hex");
    const timestamp = new Date().toISOString();

    const headers = {
      "checkout-account": MERCHANT_ID,
      "checkout-algorithm": "sha256",
      "checkout-method": "POST",
      "checkout-nonce": nonce,
      "checkout-timestamp": timestamp,
    };

    const payload = {
      stamp,
      reference: trip._id.toString(),
      amount: amountInCents,
      currency: "EUR",
      language: "FI",
      items: [
        {
          unitPrice: amountInCents,
          units: 1,
          vatPercentage: 0,
          productCode: trip._id.toString(),
          description: `Freight delivery: ${trip.items}`,
        },
      ],
      customer: {
        email: req.user.email || "customer@example.com",
      },
      redirectUrls: {
        success: `${process.env.BACKEND_URL || "http://localhost:5000"}/api/payments/paytrail/success`,
        cancel: `${process.env.BACKEND_URL || "http://localhost:5000"}/api/payments/paytrail/cancel`,
      },
      callbackUrls: {
        success: `${process.env.BACKEND_URL || "http://localhost:5000"}/api/payments/paytrail/callback`,
        cancel: `${process.env.BACKEND_URL || "http://localhost:5000"}/api/payments/paytrail/callback`,
      },
    };

    const signature = calculateHmac(SECRET_KEY, headers, payload);

    const response = await axios.post(PAYTRAIL_API_URL, payload, {
      headers: {
        ...headers,
        signature,
        "Content-Type": "application/json; charset=utf-8",
      },
    });

    return res.status(200).json({
      success: true,
      paymentUrl: response.data.href,
      providers: response.data.providers, // Contains direct bank buttons & MobilePay
    });
  } catch (error) {
    console.error("Paytrail payment initiation error:", error?.response?.data || error.message);
    return res.status(500).json({ message: "Failed to initiate Paytrail payment." });
  }
};

/**
 * Paytrail Callback Webhook handler to transition escrowStatus -> "locked"
 */
export const handlePaytrailCallback = async (req, res) => {
  try {
    const query = req.query;
    const checkoutStatus = query["checkout-status"];
    const tripId = query["checkout-reference"];

    if (checkoutStatus === "ok" && tripId) {
      // Lock the funds in escrow upon successful Finnish bank/MobilePay transfer
      await TripRequest.findByIdAndUpdate(tripId, {
        escrowStatus: "locked",
      });

      console.log(`[Paytrail Escrow Locked] Trip ID: ${tripId}`);
      return res.status(200).send("OK");
    }

    return res.status(400).send("Payment non-successful");
  } catch (error) {
    console.error("Error processing Paytrail callback:", error);
    return res.status(500).send("Internal Server Error");
  }
};