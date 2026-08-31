import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import http from "http";
import path from "path";

// 1. Load environment variables before importing configs/services
dotenv.config();

// Config imports
import dbConnect from "./config/dbConnection.js";

import { initSocket } from "./sockets/freight.socket.js";

// Route imports
import userRoutes from "./routes/user.route.js";
import requestRoutes from "./routes/make.request.route.js";
import kycRoutes from "./routes/kyc.route.js";
import payRoutes from "./routes/pay.route.js";
import passwordResetRoutes from "./routes/password.reset.route.js";
import awsRoutes from "./routes/aws-email.route.js";
import bidRoutes from "./routes/bid.route.js";
import chatRoute from "./routes/chat.route.js";
const app = express();

// 2. Core Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
// 3. Database Connection
dbConnect();

const server = http.createServer(app);
initSocket(server);

// 4. API Routes
app.use("/api/users", userRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/payments", payRoutes);
app.use("/api/auth", passwordResetRoutes);
app.use("/api/aws", awsRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/chat", chatRoute);

// 5. Health Check Route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server running smoothly." });
});

// 6. Catch-All 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
});

// 7. Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Global Error:", err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

// 8. Server Start
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});