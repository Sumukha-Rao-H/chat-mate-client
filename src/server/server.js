const express = require("express");
const cors = require("cors");
const { sequelize, User, FriendRequest, Friendship } = require("./db"); // Import models
const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// User routes
app.use("/api", userRoutes);

// Sync database and start server
sequelize.sync({ force: false }) // Use `force: false` to avoid dropping tables on each restart
    .then(() => {
        console.log("Database connected and models synced!");
        app.listen(5000, () => console.log("Server running on http://localhost:5000"));
    })
    .catch((err) => {
        console.error("Database connection error:", err);
    });

