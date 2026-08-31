import { io } from "socket.io-client";

// ⚠️ 1. REPLACE THIS WITH AN ACTUAL FREIGHT ID FROM YOUR DATABASE/APP
const FREIGHT_ID = "65d1f234a1b2c3d4e5f67890"; // <-- Paste a real freight ID here!

// ⚠️ 2. STARTING DRIVER LOCATION (near your pickup area)
let currentLat = 28.6139; // Replace with lat near your pickup
let currentLng = 77.2090; // Replace with lng near your pickup

const socket = io("http://localhost:8000", {
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("🟢 Driver Simulator Connected with Socket ID:", socket.id);

  // Join the room for this freight
  socket.emit("join_freight_room", { freightId: FREIGHT_ID });

  console.log(`🚀 Starting simulated drive for Freight #${FREIGHT_ID}...`);

  // Send a new GPS update every 2 seconds moving slightly north-east
  setInterval(() => {
    currentLat += 0.0005; // Moves driver slightly north
    currentLng += 0.0005; // Moves driver slightly east

    console.log(`📡 Emitting new GPS: Lat ${currentLat.toFixed(4)}, Lng ${currentLng.toFixed(4)}`);

    socket.emit("update_driver_location", {
      freightId: FREIGHT_ID,
      latitude: currentLat,
      longitude: currentLng,
    });
  }, 2000);
});

socket.on("disconnect", () => {
  console.log("🔴 Driver Simulator Disconnected");
});