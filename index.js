require("dotenv").config(); // <-- add this at the top

const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

let onlineUsers = 0;
const disconnectTimers = {};

io.on("connection", (socket) => {
  if (disconnectTimers[socket.id]) {
    clearTimeout(disconnectTimers[socket.id]);
    delete disconnectTimers[socket.id];
  }

  onlineUsers++;
  console.log(`User connected: ${socket.id} | Total: ${onlineUsers}`);
  socket.emit("visitorCount", onlineUsers);
  socket.broadcast.emit("visitorCount", onlineUsers);

  socket.on("disconnect", () => {
    disconnectTimers[socket.id] = setTimeout(() => {
      onlineUsers = Math.max(0, onlineUsers - 1);
      console.log(`User disconnected: ${socket.id} | Total: ${onlineUsers}`);
      io.emit("visitorCount", onlineUsers);
      delete disconnectTimers[socket.id];
    }, 1000);
  });
});

setInterval(() => {
  io.emit("visitorCount", onlineUsers);
}, 5000);

app.get("/", (req, res) => {
  res.send("Visitor tracker backend running.");
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
