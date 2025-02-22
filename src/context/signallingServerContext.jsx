import React, { createContext, useContext, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import signalingSocket from "../sockets/signallingServer";
import CallNotification from "../components/HomePageComponents/IncomingCall";
import { updateCallState } from "./callContext";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [remoteSdp, setRemoteSdp] = useState(null);
  const [isCalling, setIsCalling] = useState(false);

  useEffect(() => {
    const auth = getAuth();

    // Listen for auth state changes (to handle refresh scenarios)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);

        // 🔹 Ensure socket connects AFTER user is set
        if (!signalingSocket.connected) {
          signalingSocket.connect();
        }
        // 🔹 Re-register user on reconnection
        signalingSocket.on("connect", () => {     
          console.log("Socket reconnected, re-registering user...");
          signalingSocket.emit("register-user", { uid: user.uid });
        });
  
        signalingSocket.emit("register-user", { uid: user.uid });
      } else {
        setUser(null);
      }
    });

    return () => {
      unsubscribe();
      signalingSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    // Incoming call handler
    const handleIncomingCall = ({ callerId, isVideoCall, sdp }) => {
      console.log("Incoming call from:", callerId);
      setIncomingCall({ callerId, isVideoCall });
      setRemoteSdp(sdp);
    };

    // Call accepted handler
    const handleCallAccepted = ({ recipientId, sdp }) => {
      console.log("Call accepted by:", recipientId);
      setRemoteSdp(sdp);
    };

    // Call rejected handler
    const handleCallRejected = ({ recipientId }) => {
      console.log("Call rejected by:", recipientId);
      setIncomingCall(null);
    };

    // ICE Candidate handler
    const handleIceCandidate = ({ candidate }) => {
      console.log("Received ICE Candidate:", candidate);
    };

    // SDP handler
    const handleSdp = ({ sdp }) => {
      console.log("Received SDP:", sdp);
      setRemoteSdp(sdp);
    };

    // Attach event listeners
    signalingSocket.on("incoming-call", handleIncomingCall);
    signalingSocket.on("call-accepted", handleCallAccepted);
    signalingSocket.on("call-rejected", handleCallRejected);
    signalingSocket.on("ice-candidate", handleIceCandidate);
    signalingSocket.on("sdp", handleSdp);

    return () => {
      // Cleanup listeners on unmount
      signalingSocket.off("incoming-call", handleIncomingCall);
      signalingSocket.off("call-accepted", handleCallAccepted);
      signalingSocket.off("call-rejected", handleCallRejected);
      signalingSocket.off("ice-candidate", handleIceCandidate);
      signalingSocket.off("sdp", handleSdp);
    };
  }, []);

  const handleAcceptCall = () => {
    if (incomingCall) {
      if (!remoteSdp) {
        console.error("No valid SDP received. Cannot accept call.");
        return;
      }
      
      console.log("Accepting call with SDP:", remoteSdp); // Debugging log
  
      signalingSocket.emit("accept-call", {
        callerId: incomingCall.callerId,
        recipientId: user.uid,
        sdp: remoteSdp,
      });
      setIncomingCall(null);
      updateCallState(true);
    }
  };

  const handleDeclineCall = () => {
    if (incomingCall) {
      signalingSocket.emit("reject-call", {
        callerId: incomingCall.callerId,
        recipientId: user.uid,
      });
  
      console.log("Call rejected");
  
      // Delay state update to avoid React warning
      setTimeout(() => setIncomingCall(null), 0);
    }
  };
  

  return (

    <SocketContext.Provider value={{ signalingSocket, user,}}>
      {children}
      {incomingCall && (
        <>
        {console.log("📢 Rendering Call Notification:", incomingCall)}
        <CallNotification
          callerName={incomingCall.callerName} 
          isVideoCall={incomingCall.isVideoCall}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
          />
        </>
      )}
    </SocketContext.Provider>
  );
};
