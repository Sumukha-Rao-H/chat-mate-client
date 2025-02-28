import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useCallManager } from "../context/callManagerContext";
import {
  ArrowsRightLeftIcon,
  PhoneXMarkIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  SlashIcon,
} from "@heroicons/react/24/outline";

const positions = ["bottom-right", "bottom-left", "top-right", "top-left"];

const FloatingCallWindow = () => {
  const { isCalling, isMinimized, localStream, remoteStream, handleEndCall } =
    useCallManager();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [position, setPosition] = useState("bottom-right");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const isVideoCall = true;

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      console.log("🎥 Assigning local stream to video element.");
      localVideoRef.current.srcObject = localStream;
    } else {
      console.warn("⚠️ No local stream found.");
    }

    if (remoteStream && remoteVideoRef.current) {
      console.log("📡 Assigning remote stream to video element.");
      remoteVideoRef.current.srcObject = remoteStream;

      // 🔍 Ensure video plays to avoid NotSupportedError
      remoteVideoRef.current.play().catch((err) => {
        console.error("🚨 Video play error:", err);
      });
    } else {
      console.warn("⚠️ No remote stream found.");
    }
  }, [localStream, remoteStream]);

  const getPositionStyles = () => {
    if (isFullScreen) {
      return {
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        borderRadius: "0px",
      };
    }
    const margin = 20;
    switch (position) {
      case "top-left":
        return { top: margin, left: margin };
      case "top-right":
        return { top: margin, right: margin };
      case "bottom-left":
        return { bottom: margin, left: margin };
      case "bottom-right":
      default:
        return { bottom: margin, right: margin };
    }
  };

  const cyclePosition = () => {
    const nextIndex = (positions.indexOf(position) + 1) % positions.length;
    setPosition(positions[nextIndex]);
  };

  if (!isCalling) return null;

  return (
    <motion.div
      animate={{
        width: isFullScreen ? "100vw" : isMinimized ? "160px" : "300px",
        height: isFullScreen ? "100vh" : isMinimized ? "160px" : "200px",
        zIndex: 50,
        ...getPositionStyles(),
      }}
      transition={{ type: "spring", stiffness: 150, damping: 20 }}
      className="fixed bg-gray-900 text-white rounded-lg shadow-lg flex flex-col overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="w-full bg-gray-800 p-2 rounded-t-lg flex justify-between items-center">
        <span className="text-xs">Ongoing Call</span>
        <div className="flex gap-2">
          <button
            onClick={cyclePosition}
            className="text-gray-300 hover:text-white"
          >
            <ArrowsRightLeftIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="text-gray-300 hover:text-white"
          >
            {isFullScreen ? (
              <ArrowsPointingInIcon className="h-4 w-4" />
            ) : (
              <ArrowsPointingOutIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Video Section */}
      <div className="relative w-full h-full">
        {remoteStream && (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full bg-black"
          />
        )}
        {localStream && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute bottom-2 right-2 w-20 h-20 border-2 border-white rounded-md shadow-md"
          />
        )}
      </div>
      <div
        className={`absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-3 transition-opacity duration-300 ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="relative text-white hover:text-gray-300 w-6 h-6"
        >
          <MicrophoneIcon
            className={`h-6 w-6 ${isMuted ? "text-red-500" : "text-white"}`}
          />
          {isMuted && (
            <SlashIcon className="absolute top-0 left-0 h-6 w-6 size-10 rotate-[120deg] scale-125 text-red-500" />
          )}
        </button>
        {isVideoCall && (
          <button
            onClick={() => setIsVideoOn(!isVideoOn)}
            className="text-white hover:text-gray-300"
          >
            {isVideoOn ? (
              <VideoCameraIcon className="h-6 w-6" />
            ) : (
              <VideoCameraSlashIcon className="h-6 w-6 text-red-500" />
            )}
          </button>
        )}
        <button
          onClick={handleEndCall}
          className="text-red-500 hover:text-red-700"
        >
          <PhoneXMarkIcon className="h-6 w-6" />
        </button>
      </div>
    </motion.div>
  );
};

export default FloatingCallWindow;