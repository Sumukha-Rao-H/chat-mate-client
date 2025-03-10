import React, { useEffect, useRef } from "react";
import { useCallManager } from "../../context/callManagerContext";
import {
  PhoneIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  PhoneXMarkIcon,
  ArrowLeftIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";
import  MediaGallery  from "./MediaGallery.jsx";

const ChatWindow = ({
  activeConversation,
  handleBackToConversations,
  messages,
  curUser,
  handleScroll,
  chatContainerRef,
  newMessage,
  setNewMessage,
  handleSendMessage,
}) => {
  const {
    isCalling,
    isMuted,
    setIsMuted,
    localVideoRef,
    remoteVideoRef,
    startCall,
    handleEndCall,
  } = useCallManager();

  const mediaItems = [
    { id: 1, type: 'image', url: 'https://picsum.photos/id/1015/1920/1080' },
    { id: 2, type: 'video', url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg' },
    { id: 3, type: 'image', url: 'https://picsum.photos/id/1016/1920/1080' },
  
    { id: 4, type: 'image', url: 'https://picsum.photos/id/1018/1920/1080' },
    { id: 5, type: 'video', url: 'https://img.youtube.com/vi/oHg5SJYRHA0/maxresdefault.jpg' },
    { id: 6, type: 'image', url: 'https://picsum.photos/id/1020/2560/1440' },
  
    { id: 7, type: 'image', url: 'https://picsum.photos/id/1024/2560/1440' },
    { id: 8, type: 'video', url: 'https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg' },
    { id: 9, type: 'image', url: 'https://picsum.photos/id/1025/2560/1440' },
  
    { id: 10, type: 'image', url: 'https://picsum.photos/id/1027/2560/1440' },
    { id: 11, type: 'video', url: 'https://img.youtube.com/vi/3JZ_D3ELwOQ/maxresdefault.jpg' },
    { id: 12, type: 'image', url: 'https://picsum.photos/id/1033/2560/1440' },
  
    { id: 13, type: 'image', url: 'https://picsum.photos/id/1035/2560/1440' },
    { id: 14, type: 'video', url: 'https://img.youtube.com/vi/L_jWHffIx5E/maxresdefault.jpg' },
    { id: 15, type: 'image', url: 'https://picsum.photos/id/1038/2560/1440' },
  
    { id: 17, type: 'video', url: 'https://img.youtube.com/vi/fJ9rUzIMcZQ/maxresdefault.jpg' },
    { id: 16, type: 'image', url: 'https://picsum.photos/id/1040/2560/1440' },
  ];  
  

  const lastMessageRef = useRef(null)
  
  useEffect(() => {
    // Scroll to the latest message
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="w-full md:w-3/4 flex h-full flex-col">
      {activeConversation ? (
        <>
          {/* Header */}
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
                onClick={() => startCall(activeConversation, false)}
              />
              <VideoCameraIcon
                className="h-6 w-6 text-gray-500 cursor-pointer hover:text-gray-700"
                onClick={() => startCall(activeConversation, true)}
              />
            </div>
          </div>

          <MediaGallery mediaItems={mediaItems} />

          {/* Chat Messages Container */}
          <div className="flex flex-col flex-grow overflow-hidden">
            <div
              ref={chatContainerRef}
              onScroll={handleScroll}
              className="flex-grow overflow-y-auto p-4 h-0"
              style={{ maxHeight: "calc(100vh - 128px)" }} // Ensures scrollbar stops above footer
            >
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
              <div ref={lastMessageRef}></div>
            </div>
          </div>

          {/* Footer (Fixed & Above Scroll) */}
          <div className="border-t border-gray-300 p-4 flex gap-4 items-center bg-white relative md:pb-20">
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
