const express = require("express");
const {
    createOrUpdateUser, 
    searchUsers,
    storePublicKey,
    getPublicKey, 
} = require("../controllers/userController");
const { 
    sendFriendRequest, 
    getFriendRequests, 
    acceptFriendRequest, 
    fetchFriends, 
    rejectFriendRequest
} = require("../controllers/socialController");

const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/user", verifyToken, createOrUpdateUser);
router.get("/user/search", searchUsers);
router.post("/storePublicKey", storePublicKey);
router.get("/getPublicKey/:uid", getPublicKey);

router.post("/friend-request", sendFriendRequest);
router.post("/accept-friend-request", acceptFriendRequest);
router.post("/reject-friend-request", rejectFriendRequest);
router.get("/get-requests", getFriendRequests);
router.get("/get-friends", fetchFriends);

module.exports = router;
