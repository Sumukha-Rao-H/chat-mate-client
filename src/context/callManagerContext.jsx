import React, { createContext, useContext, useRef, useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import signalingSocket from "../sockets/signallingServer";
import FloatingCallWindow from "../components/FloatingCallWindow";
import CallNotification from "../components/HomePageComponents/IncomingCall";
import Peer from "simple-peer";

const CallManagerContext = createContext();
export const useCallManager = () => useContext(CallManagerContext);

export const CallManagerProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [currentRecipient, setCurrentRecipient] = useState(null);
  const peerRef = useRef(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        if (!signalingSocket.connected) signalingSocket.connect();
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
    signalingSocket.on("incoming-call", ({ callerId, isVideoCall, signal }) => {
      console.log("Received incoming call:", { callerId, isVideoCall, signal });
      if (!signal) {
        console.error("Error: Received undefined signal from caller");
        return;
      }
      setIncomingCall({ callerId, isVideoCall, signal });
    });

    signalingSocket.on("call-accepted", ({ recipientId, signal }) => {
      console.log("Call accepted, connecting peer with signal:", signal);
      if (!peerRef.current) {
        console.error("Error: Peer instance not initialized before signaling");
        return;
      }
      peerRef.current.signal(signal);
      setCurrentRecipient(recipientId);
    });

    signalingSocket.on("call-rejected", () => {
      console.log("Call rejected by recipient");
      setIsCalling(false);
      setLocalStream(null);
      setIncomingCall(null);
    });

    signalingSocket.on("call-ended", () => {
      console.log("Call ended by other party");
      setIsCalling(false);
      setLocalStream(null);
      setRemoteStream(null);
      setCurrentRecipient(null);
    });

    return () => {
      signalingSocket.off("incoming-call");
      signalingSocket.off("call-accepted");
      signalingSocket.off("call-rejected");
      signalingSocket.off("call-ended");
    };
  }, []);

  const startCall = async (activeConversation, isVideoCall) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoCall,
        audio: true,
      });
      setLocalStream(stream);
  
      console.log("Creating Peer instance...");
      peerRef.current = new Peer({ initiator: true, trickle: false, stream });
  
      peerRef.current.on("signal", (data) => {
        console.log("Emitting outgoing call with signal:", data);
        if (!data) {
          console.error("Error: Generated signal data is undefined");
          return;
        }
        signalingSocket.emit("call-user", {
          callerId: user.uid,
          recipientId: activeConversation?.uid,
          isVideoCall,
          signal: data,
        });
      });
  
      peerRef.current.on("stream", (remoteStream) => {
        console.log("Receiving remote stream");
        setRemoteStream(remoteStream);
      });
  
      console.log("Waiting for Peer to generate signal...");
      setIsCalling(true);
    } catch (error) {
      console.error("Error starting call:", error);
    }
  };
  
  const handleAcceptCall = async () => {
    if (!incomingCall || !incomingCall.signal) {
      console.error("Error: Incoming call data is missing or invalid", incomingCall);
      return;
    }
  
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: incomingCall.isVideoCall,
        audio: true,
      });
      setLocalStream(stream);
  
      console.log("Creating peer instance...");
      const peer = new Peer({ initiator: false, trickle: false, stream });
  
      peerRef.current = peer;
  
      console.log("Peer instance created:", peerRef.current);
  
      peer.on("signal", (data) => {
        console.log("Sending back accept signal:", data);
        signalingSocket.emit("accept-call", {
          callerId: incomingCall.callerId,
          recipientId: user.uid,
          signal: data,
        });
      });
  
      peer.on("stream", (remoteStream) => {
        console.log("Receiving remote stream");
        setRemoteStream(remoteStream);
        //setIsCalling(true); // Move setIsCalling here
      });
  
      console.log("Sending initial signal to peer:", incomingCall.signal);
      if (!peerRef.current) {
        console.error("Error: Peer instance is not initialized before signaling");
        return;
      }
      peerRef.current.signal(incomingCall.signal);
  
      setIncomingCall(null);
      setIsCalling(true);
      setCurrentRecipient(incomingCall.callerId);
    } catch (error) {
      console.error("Error accepting call:", error);
    }
  };
  
  
  const handleEndCall = () => {
    const recipientId = currentRecipient || incomingCall?.callerId;

    signalingSocket.emit("end-call", { callerId: user.uid, recipientId });
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    setIsCalling(false);
    setLocalStream(null);
    setRemoteStream(null);
    setCurrentRecipient(null);
  };

  const handleDeclineCall = () => {
    if (incomingCall) {
      signalingSocket.emit("reject-call", { callerId: incomingCall.callerId, recipientId: currentRecipient });
      setIncomingCall(null);
      setCurrentRecipient(null);
    }
  };

  return (
    <CallManagerContext.Provider
      value={{
        user,
        isCalling,
        setIsCalling,
        isMuted,
        setIsMuted,
        localStream,
        remoteStream,
        startCall,
        handleEndCall,
        incomingCall,
        handleAcceptCall,
        handleDeclineCall,
      }}
    >
      {children}
      {isCalling && <FloatingCallWindow />}
      {incomingCall && (
        <CallNotification
          callerName={incomingCall.callerId}
          isVideoCall={incomingCall.isVideoCall}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
        />
      )}
    </CallManagerContext.Provider>
  );
};
