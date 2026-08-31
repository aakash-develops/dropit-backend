import { Server } from "socket.io";
import chatService from "../services/chat.service.js";

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*", // Adjust in production if needed
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // 1. User/Driver joins a specific freight room (for trip tracking)
    socket.on("join_freight_room", ({ freightId }) => {
      if (freightId) {
        socket.join(freightId);
        console.log(`📦 Socket ${socket.id} joined freight room: ${freightId}`);
      }
    });

    // 2. Driver emits live GPS coordinates
    socket.on("update_driver_location", ({ freightId, latitude, longitude }) => {
      console.log(`📍 Driver update for freight #${freightId}:`, { latitude, longitude });

      // Relay coordinates to everyone tracking this freight room
      io.to(freightId).emit("driver_location_updated", {
        latitude,
        longitude,
      });
    });

    // 3. Client posts new freight or triggers broadcast to all online drivers
    socket.on("broadcast_new_freight", (newFreightData) => {
      console.log(`📢 Broadcasting new freight load #${newFreightData?._id || 'ID'}`);

      // Broadcasts to EVERY connected driver (except the sender)
      socket.broadcast.emit("new_freight_request", newFreightData);
    });

    // 💬 4. NEW: Driver / Shipper sends a chat message
    socket.on("send_freight_message", async (data) => {
      const { freightId, senderId, senderName, text } = data;
      if (!freightId || !senderId || !text) return;

      const messagePayload = {
        _id: new Date().getTime().toString(),
        freightId,
        senderId,
        senderName,
        text: text.trim(),
        timestamp: new Date().toISOString(),
      };

      // Broadcast message to everyone in the active freight room
      io.to(freightId).emit("receive_freight_message", messagePayload);

      // Async DB log for dispute tracking
      try {
        await chatService.createMessage({ freightId, senderId, senderName, text });
      } catch (err) {
        console.error("❌ Failed to log chat message:", err);
      }
    });

    // 5. Leave freight room on modal close
    socket.on("leave_freight_room", ({ freightId }) => {
      if (freightId) {
        socket.leave(freightId);
        console.log(`🚪 Socket ${socket.id} left freight room: ${freightId}`);
      }
    });

    // 6. Disconnect
    socket.on("disconnect", () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};