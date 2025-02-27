import React, { createContext, useContext, useRef, useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import signalingSocket from "../sockets/signallingServer";
import FloatingCallWindow from "../components/FloatingCallWindow";
import CallNotification from "../components/HomePageComponents/IncomingCall";

const CallManagerContext = createContext();

export const useCallManager = () => useContext(CallManagerContext);

export const CallManagerProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [remoteSdp, setRemoteSdp] = useState(null);
  const peerConnection = useRef(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        if (!signalingSocket.connected) {
          signalingSocket.connect();
        }
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
    const handleIncomingCall = ({ callerId, isVideoCall, sdp }) => {
      console.log("Incoming call from:", callerId);
      setIncomingCall({ callerId, isVideoCall });
      setRemoteSdp(sdp);
    };

    const handleCallAccepted = ({ recipientId, sdp }) => {
      console.log("Call accepted by:", recipientId);
      setRemoteSdp(sdp);
    };

    const handleCallRejected = ({ recipientId }) => {
      console.log("Call rejected by:", recipientId);
      setIncomingCall(null);
    };

    const handleIceCandidate = ({ candidate }) => {
      console.log("Received ICE Candidate:", candidate);
      if (peerConnection.current) {
        peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    signalingSocket.on("incoming-call", handleIncomingCall);
    signalingSocket.on("call-accepted", handleCallAccepted);
    signalingSocket.on("call-rejected", handleCallRejected);
    signalingSocket.on("ice-candidate", handleIceCandidate);

    return () => {
      signalingSocket.off("incoming-call", handleIncomingCall);
      signalingSocket.off("call-accepted", handleCallAccepted);
      signalingSocket.off("call-rejected", handleCallRejected);
      signalingSocket.off("ice-candidate", handleIceCandidate);
    };
  }, []);

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        signalingSocket.emit("ice-candidate", {
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    return pc;
  };

  const startCall = async (activeConversation, video = true) => {
    if (!signalingSocket || !signalingSocket.connected) {
      console.error("Socket not connected. Cannot start call.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video,
        audio: true,
      });
      setLocalStream(stream);

      peerConnection.current = createPeerConnection();
      stream
        .getTracks()
        .forEach((track) => peerConnection.current.addTrack(track, stream));

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      signalingSocket.emit("call-user", {
        callerId: auth.currentUser.uid,
        callerName: auth.currentUser.displayName,
        recipientId: activeConversation?.uid,
        isVideoCall: video,
        sdp: offer,
      });

      setIsCalling(true);
    } catch (error) {
      console.error("Error starting call:", error);
    }
  };

  const handleEndCall = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (signalingSocket && auth.currentUser) {
      signalingSocket.emit("end-call", {
        callerId: auth.currentUser.uid,
        recipientId: remoteStream ? remoteStream.uid : null,
      });
    }

    setIsCalling(false);
    setIsInCall(false);
    setLocalStream(null);
    setRemoteStream(null);
  };

  const handleAcceptCall = () => {
    if (incomingCall) {
      if (!remoteSdp) {
        console.error("No valid SDP received. Cannot accept call.");
        return;
      }

      console.log("Accepting call with SDP:", remoteSdp);

      signalingSocket.emit("accept-call", {
        callerId: incomingCall.callerId,
        recipientId: user.uid,
        sdp: remoteSdp,
      });
      setIncomingCall(null);
      setIsCalling(true);
    }
  };

  const handleDeclineCall = () => {
    if (incomingCall) {
      signalingSocket.emit("reject-call", {
        callerId: incomingCall.callerId,
        recipientId: user.uid,
      });

      console.log("Call rejected");

      setTimeout(() => setIncomingCall(null), 0);
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
        isMinimized,
        setIsMinimized,
        incomingCall,
        handleAcceptCall,
        handleDeclineCall,
      }}
    >
      {children}
      {isCalling && <FloatingCallWindow />}
      {incomingCall && (
        <CallNotification
          callerName={incomingCall.callerName}
          isVideoCall={incomingCall.isVideoCall}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
        />
      )}
    </CallManagerContext.Provider>
  );
};