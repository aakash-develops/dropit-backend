import User from "../models/user.model.js";
import checkMongoValidity from "../utils/utils.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

/**
 * Middleware: Verify user ID format and existence in MongoDB
 */
export const checkIfUserExists = async (req, res, next) => {
  try {
    const userId = req.params.id;

    if (!checkMongoValidity(userId)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    const userDetails = await User.findById(userId).select("-password");
    if (!userDetails) {
      return res.status(404).json({ message: "User does not exist." });
    }

    req.usersData = userDetails;
    next();
  } catch (error) {
    console.error("Middleware checkIfUserExists error:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Get current user details (via middleware)
 */
export const getUserDetails = async (req, res) => {
  return res.status(200).json(req.usersData);
};

/**
 * Register a new user
 */
export const createUsers = async (req, res) => {
  try {
    const { email, password, firstName, lastName, company, address, phoneNumber, gender, roles } = req.body;

    if (!email || !password || !gender) {
      return res.status(400).json({ message: "Email, password, and gender are required fields." });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check if email already exists
    const checkIfEmailExists = await User.findOne({ email: normalizedEmail });
    if (checkIfEmailExists) {
      return res.status(400).json({ message: "User already exists with this email." });
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create user (prevent unauthorized role escalation)
    const user = await User.create({
      firstName,
      lastName,
      company,
      address,
      phoneNumber,
      gender,
      email: normalizedEmail,
      password: hashedPassword,
      roles: roles || "user",
    });

    // 4. Return user object without password
    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(201).json(userResponse);
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Update user details
 */
export const updateUsers = async (req, res) => {
  try {
    const userId = req.params.id;
    const { firstName, lastName, company, address, phoneNumber, gender } = req.body;

    // Explicit field update prevents overwrite of password, email, or roles
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          firstName,
          lastName,
          company,
          address,
          phoneNumber,
          gender,
        },
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      message: "User updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Fetch all users
 */
export const getAllUsers = async (req, res) => {
  try {
    const allUsers = await User.find().select("-password");
    return res.status(200).json(allUsers);
  } catch (error) {
    console.error("Error fetching all users:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Authenticate user & issue JWT
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Verify user exists
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // 2. Verify password match
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // 3. Ensure JWT Secret exists
    if (!process.env.JWT_SECRET) {
      console.error("FATAL ERROR: JWT_SECRET environment variable is missing.");
      return res.status(500).json({ message: "Server configuration error." });
    }

    // 4. Generate JWT Token
    const token = jwt.sign(
      { id: user._id, email: user.email, roles: user.roles },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 5. Hide password from response payload
    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(200).json({
      message: "Login successful.",
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Get current logged-in user profile via JWT Token
 */
export const getMyProfile = async (req, res) => {
  try {
    // req.user.id or req.user._id set by your auth middleware
    const userId = req.user.id || req.user._id;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};