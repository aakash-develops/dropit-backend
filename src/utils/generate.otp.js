import crypto from "crypto";

/**
 * Generates a cryptographically secure random numeric OTP.
 * @param {number} length - Number of digits (default is 6).
 * @returns {string} The generated OTP as a string.
 */
export const getRandomOtp = (length = 6) => {
  // Generate cryptographically secure random digits
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;

  // Fix: changed crypto.getRandomInt -> crypto.randomInt
  const otpNumber = crypto.randomInt(min, max + 1);
  return otpNumber.toString();
};