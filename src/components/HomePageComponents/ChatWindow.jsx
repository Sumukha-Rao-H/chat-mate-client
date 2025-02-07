import React, { useEffect, useRef, useState } from "react";
import {
  PhoneIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  PhoneXMarkIcon,
  PaperClipIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import signallingServer from "../../sockets/signallingServer";

const ChatWindow = ({
  activeConversation,
  handleBackToConversations,
  messages,
  curUser,
  handleScroll,
  chatContainerRef,
  lastMessageRef,
  newMessage,
  setNewMessage,
  handleSendMessage,
  socket,
}) => {
  const [isCalling, setIsCalling] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const peerConnection = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (!signallingServer) return;

    signallingServer.on("incoming-call", async ({ callerId,isVideoCall, sdp }) => {
      console.log(`Incoming ${ isVideoCall ? "video" : "audio"} call from: ${callerId}`);
      if (activeConversation.uid !== callerId) return;

      peerConnection.current = createPeerConnection();

      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(sdp)
      );
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      signallingServer.emit("accept-call", {
        callerId,
        recipientId: curUser.uid,
        sdp: answer,
      });

      setIsCalling(true);
    });

    signallingServer.on("call-accepted", async ({ sdp }) => {
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(sdp)
      );
    });

    signallingServer.on("ice-candidate", ({ candidate }) => {
      if (peerConnection.current) {
        peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => {
      signallingServer.off("incoming-call");
      signallingServer.off("call-accepted");
      signallingServer.off("ice-candidate");
    };
  }, [signallingServer, activeConversation]);

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        signallingServer.emit("ice-candidate", {
          recipientId: activeConversation.uid,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    return pc;
  };

  const startCall = async (video = false) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video,
        audio: true,
      });
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      peerConnection.current = createPeerConnection();
      stream
        .getTracks()
        .forEach((track) => peerConnection.current.addTrack(track, stream));

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      signallingServer.emit("call-user", {
        callerId: curUser.uid,
        recipientId: activeConversation.uid,
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
    setLocalStream(null);
    setRemoteStream(null);
  };

  return (
    <div className="w-full md:w-3/4 flex h-full flex-col flex-grow">
      {activeConversation ? (
        <>
          <div className="bg-white px-4 py-3 border-b border-gray-300 flex justify-between items-center">
            <button
              onClick={handleBackToConversations}
              className="sm:hidden p-2 rounded-full hover:bg-gray-700 transition-all"
            >
              <ArrowLeftIcon className="w-6 h-6 text-gray-500" />
            </button>
            <div className="font-bold text-gray-800">
              {activeConversation.displayName}
            </div>
            <div className="flex items-center space-x-4">
              <PhoneIcon
                className="h-6 w-6 text-gray-500 cursor-pointer hover:text-gray-700"
                onClick={() => startCall(false)}
              />
              <VideoCameraIcon
                className="h-6 w-6 text-gray-500 cursor-pointer hover:text-gray-700"
                onClick={() => startCall(true)}
              />
            </div>
          </div>

          {isCalling && (
            <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-t border-gray-300">
              <div className="flex items-center gap-2">
                <span className="text-gray-700">You are on a call</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-2 rounded ${
                    isMuted
                      ? "bg-red-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {" "}
                  <MicrophoneIcon className="w-5 h-5" />{" "}
                </button>
                <button
                  onClick={handleEndCall}
                  className="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition-all flex items-center gap-2"
                >
                  {" "}
                  <PhoneXMarkIcon className="w-5 h-5" />{" "}
                </button>
              </div>
            </div>
          )}

          <div className="flex-grow bg-gray-50 px-6 py-3 overflow-y-scroll max-h-[calc(100vh-233px)]">
            {isCalling ? (
              <div className="flex flex-col justify-between h-full">
                <div className="flex justify-center items-center w-full h-[80%] p-4">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    className="w-full h-full bg-gray-600 rounded-lg shadow-lg"
                  />
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    className="absolute bottom-4 right-4 w-[20%] h-[20%] border-2 border-white rounded-md shadow-md"
                  />
                </div>
              </div>
            ) : (
              <div onScroll={handleScroll} ref={chatContainerRef}>
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`mb-2 ${
                      msg.senderId === curUser.uid ? "text-right" : "text-left"
                    }`}
                  >
                    <span
                      className={`inline-block px-4 py-2 rounded-lg ${
                        msg.senderId === curUser.uid
                          ? "bg-gray-500 text-white"
                          : "bg-gray-300"
                      }`}
                    >
                      {msg.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div ref={lastMessageRef}></div>
          </div>

          <div className="border-t border-gray-300 p-4 pb-4 flex gap-4 items-center fixed bottom-0 w-full bg-white md:bottom-16 md:w-3/4">
            <PaperClipIcon className="h-6 w-6 text-gray-500 cursor-pointer hover:text-gray-700" />
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Send a message"
              className="flex-grow border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
            />
            <button
              onClick={handleSendMessage}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-all"
            >
              Send
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-gray-600">
          Select a conversation to start chatting.
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
