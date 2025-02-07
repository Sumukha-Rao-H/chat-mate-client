import { io } from "socket.io-client";

const SIGNALING_URL = `${process.env.REACT_APP_SERVER_URL}/signaling`;

const signallingServer = io(SIGNALING_URL, {
    autoConnect: false, // Prevent auto-connect on import
    transports: ["websocket"], // Use WebSocket for better performance
  });
  

export default signallingServer;