const { saveMessage } = require('../controllers/chatController');
const Message = require('../models/messageModel');

module.exports = (io) => {
    io.on("connection", (socket) => {
        //console.log("A user connected:", socket.id);

        // Join a room for a conversation
        socket.on("joinRoom", async ({ senderId, receiverId }) => {
            const roomId =[ senderId, receiverId].sort().join("_"); // Unique room ID
            socket.join(roomId);
            //console.log(`${socket.id} joined room: ${roomId}`);

            // Fetch chat history
            try {
                const messages = await Message.findAll({
                    where: { receiverId: roomId },
                    order: [['timestamp', 'ASC']],
                    limit: 50, // Fetch the latest 50 messages
                });

                // Send chat history to the user who joined the room
                socket.emit("chatHistory", messages);
            } catch (error) {
                console.error("Failed to fetch chat history:", error);
            }
        });

        // Handle sending messages
        socket.on("sendMessage", async ({ senderId, receiverId, messageS, messageR }) => {
            const roomId = [senderId, receiverId].sort().join("_");

            // Save the message to the database
            try {
                const newMessage = {
                    senderId,
                    receiverId,
                    messageS,
                    messageR,
                };
                await saveMessage(newMessage);

                // Emit the message to all users in the room
                io.to(roomId).emit("receiveMessage", { senderId, messageR });
                //console.log(`Message sent in room ${roomId}: ${encryptedMessage}`);
            } catch (error) {
                console.error("Failed to save message:", error);
            }
        });

        socket.on("voiceCall", ({ roomId, signalData }) => {
            // Relay the signal data to the other peer in the room
            socket.to(roomId).emit("voiceCall", { signalData, from: socket.id });
        });

        // Handle voice call answer
        socket.on("answerCall", ({ roomId, signalData }) => {
            // Relay the signal data back to the caller
            socket.to(roomId).emit("callAnswered", { signalData, from: socket.id });
        });

        // Handle ending the call
        socket.on("endCall", ({ roomId }) => {
            // Notify all users in the room that the call has ended
            io.to(roomId).emit("callEnded");
        });

        // Handle disconnection
        socket.on("disconnect", () => {
            //console.log("A user disconnected:", socket.id);
        });
    });
};
