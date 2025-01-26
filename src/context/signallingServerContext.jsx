import React, { createContext, useContext, useEffect } from "react";
import signalingSocket from "../sockets/signallingServer";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children, user }) => {
  useEffect(() => {
    if (user) {
      // Connect the signaling socket
      signalingSocket.connect();
      console.log("Signaling socket connected");

      // Emit an event to identify the user
      signalingSocket.emit("user-connected", { userId: user.id });

      // Handle incoming events (optional)
      signalingSocket.on("incoming-call", (data) => {
        console.log("Incoming call:", data);
      });

      // Cleanup on unmount or logout
      return () => {
        signalingSocket.disconnect();
        console.log("Signaling socket disconnected");
      };
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ signalingSocket }}>
      {children}
    </SocketContext.Provider>
  );
};
