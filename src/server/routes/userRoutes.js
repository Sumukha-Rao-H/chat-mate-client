const express = require("express");
const { createOrUpdateUser, searchUsers } = require("../controllers/userController");
const { 
    sendFriendRequest, 
    getFriendRequests, 
    acceptFriendRequest, 
    fetchFriends, 
    rejectFriendRequest 
} = require("../controllers/socialController");

const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// Route to create or update user after login
router.post("/user", verifyToken, createOrUpdateUser);
router.get("/user/search", searchUsers);

router.post("/friend-request", sendFriendRequest);
router.post("/accept-friend-request", acceptFriendRequest);
router.post("/reject-friend-request", rejectFriendRequest);
router.get("/get-requests", getFriendRequests);
router.get("/get-friends", fetchFriends);


module.exports = router;
