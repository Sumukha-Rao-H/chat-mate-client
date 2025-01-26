import React, { useEffect } from "react";
import { PhoneIcon, VideoCameraIcon, MicrophoneIcon, PhoneXMarkIcon, PaperClipIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

const ChatWindow = ({
  activeConversation,
  handleAudioCall,
  handleVideoCall,
  isAudioCalling,
  isMuted,
  isVideoCalling,
  isVideoOff,
  handleMute,
  handleEndCall,
  messages,
  curUser,
  handleScroll,
  chatContainerRef,
  lastMessageRef,
  newMessage,
  setNewMessage,
  handleSendMessage,
  fetchMessages,
  page,
  handleBackToConversations,
}) => {
  return (
    <div className="w-full md:w-3/4 flex h-full flex-col flex-grow">
      {activeConversation ? (
        <>
          {/* Chat Header */}
          <div className="bg-white px-4 py-3 border-b border-gray-300 flex justify-between items-center">

          <button
              onClick={handleBackToConversations}
              className="sm:hidden p-2 rounded-full hover:bg-gray-700 transition-all"
            >
              <ArrowLeftIcon className="w-6 h-6 text-gray-500" />
            </button>
            <div className="font-bold text-gray-800">{activeConversation.displayName}</div>
            <div className="flex items-center space-x-4">
              <PhoneIcon className="h-6 w-6 text-gray-500 cursor-pointer hover:text-gray-700" onClick={handleAudioCall} />
              <VideoCameraIcon className="h-6 w-6 text-gray-500 cursor-pointer hover:text-gray-700" onClick={handleVideoCall} />
            </div>
          </div>

          {/* Audio call bar */}
          {isAudioCalling && (
            <div className="bg-gray-100 border-t border-gray-300 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-700">You are on a call</span>
              </div>
              <div className="flex items-center gap-3">
                {/* Mute Button */}
                <button
                  onClick={handleMute}
                  className={`px-3 py-1 rounded flex items-center gap-2 ${isMuted ? "bg-red-500 text-white" : "bg-gray-200 text-gray-700"} hover:bg-red-600 transition-all`}
                >
                  <MicrophoneIcon className="w-5 h-5" />
                </button>

                {/* End Call Button */}
                <button
                  onClick={handleEndCall}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-all flex items-center gap-2"
                >
                  <PhoneXMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Chat Content (Scrollable) */}
          <div className="flex-grow bg-gray-50 px-6 py-3 overflow-y-scroll max-h-[calc(100vh-233px)]">
            {isVideoCalling ? (
              <div className="flex flex-col justify-between h-full">
                {/* Video Call UI */}
                <div className="flex justify-center items-center w-full h-[80%] p-4">
                  <div className="relative w-full max-w-[700px] h-full">
                    {/* Other User's Video - Larger Window */}
                    <div className="w-full h-full bg-gray-600 flex justify-center items-center rounded-lg shadow-lg">
                      <p className="text-xl text-white">Other User</p>
                    </div>

                    {/* Self Video as a Small Rectangle at the Bottom-Right with Thin Border */}
                    <div className="absolute bottom-4 right-4 w-[20%] h-[20%] bg-gray-600 flex justify-center items-center border-2 border-white rounded-md shadow-md">
                      <p className="text-xs text-white">You</p>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="border-gray-300 px-4 py-2 flex items-center justify-center">
                  <div className="flex justify-center items-center gap-4">
                    {/* Mute Button */}
                    <button
                      onClick={handleMute}
                      className={`p-3 rounded-full ${isMuted ? "bg-red-500 text-white" : "bg-gray-200 text-gray-700"} hover:bg-gray-300 transition-all`}
                    >
                      <MicrophoneIcon className="w-6 h-6" />
                    </button>

                    {/* Turn Off Video Button */}
                    <button
                      //onClick={handleTurnOffVideo}
                      className={`p-3 rounded-full ${isVideoOff ? "bg-red-500 text-white" : "bg-gray-200 text-gray-700"} hover:bg-gray-300 transition-all`}
                    >
                      <VideoCameraIcon className="w-6 h-6" />
                    </button>

                    {/* End Call Button */}
                    <button
                      onClick={handleEndCall}
                      className="p-3 rounded-full bg-red-500 text-white hover:bg-gray-300 transition-all"
                    >
                      <PhoneXMarkIcon className="w-6 h-6 inline-block" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Chat Content
              <div onScroll={handleScroll} ref={chatContainerRef}>
                {messages.map((msg, index) => (
                  <div key={index} className={`mb-2 ${msg.senderId === curUser.uid ? "text-right" : "text-left"}`}>
                    <span
                      className={`inline-block px-4 py-2 rounded-lg ${
                        msg.senderId === curUser.uid ? "bg-gray-500 text-white" : "bg-gray-300"
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

          {/* Chat Footer */}
          <div className="border-t border-gray-300 p-4 pb-4 flex gap-4 items-center fixed bottom-0 w-full bg-white md:bottom-16 md:w-3/4">
            {/* Attachment Icon */}
            <PaperClipIcon className="h-6 w-6 text-gray-500 cursor-pointer hover:text-gray-700" />
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage();
                }
              }}
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
