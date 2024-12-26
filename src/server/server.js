const express = require("express");
const cors = require('cors');
const sequelize = require("./db");
const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// User routes
app.use("/api", userRoutes);

// Sync database and start server
sequelize.sync()
    .then(() => {
        console.log("Database connected");
        app.listen(5000, () => console.log("Server running on http://localhost:5000"));
    })
    .catch((err) => console.error("Database connection error:", err));
