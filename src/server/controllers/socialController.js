const { sequelize, User, FriendRequest, Friendship } = require("../db");
const { Op } = require('sequelize');

exports.sendFriendRequest = async (req, res) => {
    const { senderUid, receiverUid } = req.body;

    try {
        if (senderUid === receiverUid) {
            return res.status(400).json({ message: "You cannot send a friend request to yourself." });
        }

        // Check if users exist
        const sender = await User.findOne({ where: { uid: senderUid } });
        const receiver = await User.findOne({ where: { uid: receiverUid } });

        if (!sender || !receiver) {
            return res.status(404).json({ message: "User not found." });
        }

        // Check for existing friend request
        const existingRequest = await FriendRequest.findOne({
            where: { senderUid, receiverUid, status: "pending" },
        });

        if (existingRequest) {
            return res.status(400).json({ message: "Friend request already sent." });
        }

        // Check for existing friendship
        const existingFriendship = await Friendship.findOne({
            where: {
                [Op.or]: [
                    { user1Uid: senderUid, user2Uid: receiverUid },
                    { user1Uid: receiverUid, user2Uid: senderUid },
                ],
            },
        });

        if (existingFriendship) {
            return res.status(400).json({ message: "You are already friends." });
        }

        // Create friend request
        const newRequest = await FriendRequest.create({ senderUid, receiverUid });

        if (newRequest) {
            console.log("Friend request created successfully:", newRequest);
            return res.status(200).json({ message: "Friend request sent successfully." });
        } else {
            return res.status(500).json({ message: "Failed to send friend request." });
        }

    } catch (error) {
        console.error("Error in sending friend request:", error);
        res.status(500).json({ message: "Internal server error.", error: error.message });
    }
};



// Get Friend Requests
exports.getFriendRequests = async (req, res) => {
    const { uid } = req.query;

    try {
        const requests = await FriendRequest.findAll({
            where: { receiverUid: uid, status: "pending" },
            include: [{ model: User, as: "sender", attributes: ["id","uid", "displayName", "photoUrl"] }],
        });

        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: "Internal server error.", error: error.message });
    }
};

exports.acceptFriendRequest = async (req, res) => {
    const { requestId } = req.body; // `requestId` is the ID of the FriendRequest to be accepted

    try {
        // Find the friend request by ID
        const friendRequest = await FriendRequest.findOne({ where: { id: requestId, status: "pending" } });

        if (!friendRequest) {
            return res.status(404).json({ message: "Friend request not found or already handled." });
        }

        // Update the status to "accepted"
        await friendRequest.update({ status: "accepted" });

        // Create a new friendship
        await Friendship.create({
            user1Uid: friendRequest.senderUid,
            user2Uid: friendRequest.receiverUid,
        });

        res.status(200).json({ message: "Friend request accepted successfully." });
    } catch (error) {
        console.error("Error accepting friend request:", error);
        res.status(500).json({ message: "Internal server error.", error: error.message });
    }
};
