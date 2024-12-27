const express = require("express");
const { createOrUpdateUser, searchUsers } = require("../controllers/userController");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// Route to create or update user after login
router.post("/user", verifyToken, createOrUpdateUser);
router.get("/user/search", searchUsers);

module.exports = router;
