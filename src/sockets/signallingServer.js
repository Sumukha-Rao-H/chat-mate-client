import { io } from "socket.io-client";

const SIGNALING_URL = `${process.env.REACT_APP_SERVER_URL}/signaling`;

const signallingServer = io(SIGNALING_URL, {
  reconnection: true, // Ensure auto-reconnect is enabled
  reconnectionAttempts: 5, // Try reconnecting 10 times
  reconnectionDelay: 2000, // Wait 2 seconds before retrying
  autoConnect: false, // Prevent auto-connect on import
  transports: ["websocket"], // Use WebSocket for better performance
});

export default signallingServer;
