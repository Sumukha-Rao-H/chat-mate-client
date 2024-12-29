const express = require("express");
const { createOrUpdateUser, searchUsers } = require("../controllers/userController");
const { sendFriendRequest, getFriendRequests, acceptFriendRequest } = require("../controllers/socialController");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// Route to create or update user after login
router.post("/user", verifyToken, createOrUpdateUser);
router.get("/user/search", searchUsers);

router.post("/friend-request", sendFriendRequest);
router.post("/accept-friend-request", acceptFriendRequest);
router.get("/get-requests", getFriendRequests);


module.exports = router;
