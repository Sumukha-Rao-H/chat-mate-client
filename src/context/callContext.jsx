import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
} from "react";
import { getAuth } from "firebase/auth";
import { useSocket } from "./signallingServerContext";
import FloatingCallWindow from "../components/FloatingCallWindow";

const CallContext = createContext();

export const useCall = () => useContext(CallContext);

const setIsCallingRef = { current: null };


export const CallProvider = ({ children, externalSetIsCalling }) => {
  const [isCalling, setIsCalling] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const peerConnection = useRef(null);
  const auth = getAuth();
  const { signalingSocket } = useSocket();

  useEffect(() => {
    setIsCallingRef.current = setIsCalling;
    return () => {
      setIsCallingRef.current = null; // Clean up when unmounted
    };
  }, []);

  useEffect(() => {
    if (!signalingSocket) return;

    signalingSocket.on("call-accepted", async ({ sdp }) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(sdp)
        );
        setIsInCall(true);
      }
    });

    signalingSocket.on("ice-candidate", ({ candidate }) => {
      if (peerConnection.current) {
        peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => {
      signalingSocket.off("call-accepted");
      signalingSocket.off("ice-candidate");
    };
  }, [signalingSocket]);

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
    peerConnection.current?.close();
    setIsCalling(false);
    if (externalSetIsCalling) externalSetIsCalling(false);
    setIsInCall(false);
    setLocalStream(null);
    setRemoteStream(null);
  };

  return (
    <CallContext.Provider
      value={{
        isCalling,
        setIsCalling,
        isMuted,
        localStream,
        remoteStream,
        startCall,
        handleEndCall,
        setIsMuted,
        isMinimized,
        setIsMinimized,
      }}
    >
      {children}
      {isCalling && <FloatingCallWindow/>}
    </CallContext.Provider>
  );
};


export const updateCallState = (value) => {
  if (setIsCallingRef.current) {
    setIsCallingRef.current(value);
  }
};