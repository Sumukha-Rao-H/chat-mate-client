const express = require("express");
const cors = require("cors");
const { sequelize, User, FriendRequest, Friendship, Message } = require("./db"); // Import models
const userRoutes = require("./routes/userRoutes");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // Allow requests from your frontend
        methods: ["GET", "POST"],
    },
});

require("./sockets/chatSocket")(io);

// User routes
app.use("/api", userRoutes);

// Sync database and start server
sequelize.sync({ force: false }) // Use `force: false` to avoid dropping tables on each restart
    .then(() => {
        console.log("Database connected and models synced!");
        server.listen(5000, () => console.log("Server running on http://localhost:5000"));
    })
    .catch((err) => {
        console.error("Database connection error:", err);
    });

