const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Setup Socket.IO with CORS
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:5173", // ✅ Update for production
    methods: ["GET", "POST"]
  }
});

let onlineUsers = 0;
const disconnectTimers = {};

// When a client connects
io.on("connection", (socket) => {
  // Cancel any pending disconnect timer (e.g. on quick refresh)
  if (disconnectTimers[socket.id]) {
    clearTimeout(disconnectTimers[socket.id]);
    delete disconnectTimers[socket.id];
  }

  // Increment and emit to all
  onlineUsers++;
  console.log(`User connected: ${socket.id} | Total: ${onlineUsers}`);
  socket.emit("visitorCount", onlineUsers);
  socket.broadcast.emit("visitorCount", onlineUsers);

  // When client disconnects
  socket.on("disconnect", () => {
    // Delay actual decrement to handle quick reconnects
    disconnectTimers[socket.id] = setTimeout(() => {
      onlineUsers = Math.max(0, onlineUsers - 1); // Prevent negative
      console.log(`User disconnected: ${socket.id} | Total: ${onlineUsers}`);
      io.emit("visitorCount", onlineUsers);
      delete disconnectTimers[socket.id];
    }, 1000); // 1 second debounce
  });
});

// Periodic sync to ensure accuracy
setInterval(() => {
  io.emit("visitorCount", onlineUsers);
}, 5000); // every 5 seconds

// Root route for sanity check
app.get("/", (req, res) => {
  res.send("Visitor tracker backend running.");
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
