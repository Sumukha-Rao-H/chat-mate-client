import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useCall } from "../context/callContext";
import { 
  PhoneXMarkIcon, 
  ArrowsPointingInIcon, 
  ArrowsPointingOutIcon, 
  ArrowsRightLeftIcon 
} from "@heroicons/react/24/outline";

const positions = ["bottom-right", "bottom-left", "top-right", "top-left"];

const FloatingCallWindow = () => {
  const { isCalling, isMinimized, localStream, remoteStream, handleEndCall } = useCall();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [position, setPosition] = useState("bottom-right");

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);

  const getPositionStyles = () => {
    if (isFullScreen) {
      return { top: 0, left: 0, width: "100vw", height: "100vh", borderRadius: "0px" };
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
    >
      {/* Header */}
      <div className="w-full bg-gray-800 p-2 rounded-t-lg flex justify-between items-center">
        <span className="text-xs">Ongoing Call</span>
        <div className="flex gap-2">
          <button onClick={cyclePosition} className="text-gray-300 hover:text-white">
            <ArrowsRightLeftIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="text-gray-300 hover:text-white"
          >
            {isFullScreen ? <ArrowsPointingInIcon className="h-4 w-4" /> : <ArrowsPointingOutIcon className="h-4 w-4" />}
          </button>
          <button onClick={handleEndCall} className="text-red-500 hover:text-red-700">
            <PhoneXMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Video Section */}
      <div className="relative w-full h-full">
        <video ref={remoteVideoRef} autoPlay className="w-full h-full bg-black" />
        <video
          ref={localVideoRef}
          autoPlay
          muted
          className="absolute bottom-2 right-2 w-20 h-20 border-2 border-white rounded-md shadow-md"
        />
      </div>
    </motion.div>
  );
};

export default FloatingCallWindow;
