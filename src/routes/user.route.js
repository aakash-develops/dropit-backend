import express from "express";
import {
  checkIfUserExists,
  createUsers,
  getAllUsers,
  getUserDetails,
  getMyProfile,
  loginUser,
  updateUsers,
} from "../services/user.service.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// 1. Public Routes
router.post("/register", createUsers);
router.post("/login", loginUser);

// 2. Exact string static routes (MUST BE FIRST!)
router.get("/me", verifyToken, getMyProfile);

// 3. Dynamic / ID routes (MUST BE LAST!)
router.get("/", getAllUsers);
router.get("/:id", checkIfUserExists, getUserDetails);
router.put("/:id", checkIfUserExists, updateUsers);

export default router;