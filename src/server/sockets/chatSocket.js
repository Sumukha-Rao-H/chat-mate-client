module.exports = (io) => {
    io.on("connection", (socket) => {
        //console.log("A user connected:", socket.id);

        // Join a room for a conversation
        socket.on("joinRoom", ({ senderId, receiverId }) => {
            const roomId = [senderId, receiverId].sort().join("_"); // Unique room ID
            socket.join(roomId);
            //console.log(`${socket.id} joined room: ${roomId}`);
        });

        // Handle sending messages
        socket.on("sendMessage", ({ senderId, receiverId, encryptedMessage }) => {
            const roomId = [senderId, receiverId].sort().join("_");
            io.to(roomId).emit("receiveMessage", { senderId, encryptedMessage });
            //console.log(`${encryptedMessage}`);
        });

        // Handle disconnection
        socket.on("disconnect", () => {
            //console.log("A user disconnected:", socket.id);
        });
    });
};
