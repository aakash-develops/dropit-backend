import mongoose from "mongoose";

/**
 * Validates if a string is a strictly valid MongoDB ObjectId.
 * @param {string} id - The MongoDB ID string to validate.
 * @returns {boolean} True if valid, false otherwise.
 */
const checkMongoValidity = (id) => {
  if (!id || typeof id !== "string") return false;

  // Strict check: verify string converts back to exact matching ObjectId
  if (mongoose.Types.ObjectId.isValid(id)) {
    return String(new mongoose.Types.ObjectId(id)) === id;
  }

  return false;
};

export default checkMongoValidity;