import React, { useEffect, useRef, useState } from "react";
import { useCallManager } from "../../context/callManagerContext";
import {
  PhoneIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  PhoneXMarkIcon,
  ArrowLeftIcon,
  PaperClipIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import MediaGallery from "./MediaGallery.jsx";

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

  const [mediaItems, setMediaItems] = useState([]);

  useEffect(() => {
    if (!messages || messages.length === 0) {
      setMediaItems([]); // No messages
      return;
    }

    const updatedMediaItems = messages
      .filter((msg) => msg.mediaUrl)
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();

        return dateB - dateA; // Descending: latest first
      })
      .map((msg, index) => ({
        id: msg.id || index,
        type: msg.mediaType || getFileType(msg.mediaUrl),
        url: msg.mediaUrl,
        createdAt: msg.createdAt, // optional, if you want to display date info
      }));

      setMediaItems(updatedMediaItems.reverse());
  }, [messages]);

  const getFileType = (url) => {
    const extension = url.split(".").pop().toLowerCase();
    const videoExtensions = ["mp4", "mov", "avi", "webm"];
    if (videoExtensions.includes(extension)) {
      return "video";
    }
    return "image";
  };

  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]); // Array for multiple files
  const [isUploading, setIsUploading] = useState(false);

  const handleFileClick = () => {
    if (isUploading) return;
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newFiles = files.map((file) => ({
      file,
      previewUrl:
        file.type.startsWith("image/") || file.type.startsWith("video/")
          ? URL.createObjectURL(file)
          : null,
    }));

    setSelectedFiles((prev) => [...prev, ...newFiles]);

    e.target.value = null; // reset input
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => {
      const updatedFiles = [...prev];
      const removed = updatedFiles.splice(index, 1);
      // Clean up URL object if it exists
      if (removed[0].previewUrl) {
        URL.revokeObjectURL(removed[0].previewUrl);
      }
      return updatedFiles;
    });
  };

  const [isSending, setIsSending] = useState(false);

  const handleSendClick = async () => {
    // console.log("handleSendClick called");
    if (isUploading) return; // Optional, depends on your logic

    // Ensure there is either a message or files to send
    if (selectedFiles.length === 0 && newMessage.trim() === "") {
      return; // Don't send if there's nothing to send
    }

    await handleSendMessage({
      textMessage: newMessage,
      files: selectedFiles,
    });

    // Clear state after sending
    setIsUploading(false);
    setSelectedFiles([]);
    setNewMessage("");
  };

  const lastMessageRef = useRef(null);

  useEffect(() => {
    // Scroll to the latest message
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && selectedFiles.length > 0) {
      e.preventDefault();
      handleSendClick();
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [newMessage, selectedFiles, isUploading]);

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
              {messages.map((msg, index) => {
                const isCurrentUser = msg.senderId === curUser.uid;
                const isTextOnly = !!msg.message && !msg.mediaUrl;

                return (
                  <div
                    key={index}
                    className={`mb-4 flex ${
                      isCurrentUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div className={`max-w-xs break-words text-sm`}>
                      {/* TEXT MESSAGE WITH BACKGROUND */}
                      {isTextOnly && (
                        <div
                          className={`inline-block px-4 py-2 rounded-lg ${
                            isCurrentUser
                              ? "bg-gray-500 text-white"
                              : "bg-gray-300 text-black"
                          }`}
                        >
                          <p>{msg.message}</p>
                        </div>
                      )}

                      {/* IMAGE MESSAGE */}
                      {msg.mediaType === "image" && msg.mediaUrl && (
                        <img
                          src={msg.mediaUrl}
                          alt="Sent media"
                          className="max-w-full h-auto rounded-lg mt-2 cursor-pointer border"
                          onClick={() => window.open(msg.mediaUrl, "_blank")}
                        />
                      )}

                      {/* VIDEO MESSAGE */}
                      {msg.mediaType === "video" && msg.mediaUrl && (
                        <video
                          controls
                          className="max-w-full h-auto rounded-lg mt-2 border"
                        >
                          <source src={msg.mediaUrl} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      )}

                      {/* DOCUMENT / FILE MESSAGE */}
                      {msg.mediaType === "document" && msg.mediaUrl && (
                        <div
                          className={`flex items-center gap-4 p-3 rounded-lg border ${
                            isCurrentUser
                              ? "bg-gray-500 text-white"
                              : "bg-gray-200 text-gray-800"
                          } mt-2 shadow-sm cursor-pointer hover:shadow-md transition`}
                          onClick={() => window.open(msg.mediaUrl, "_blank")}
                        >
                          {/* File Icon */}
                          <div className="text-4xl text-blue-600">📄</div>

                          {/* File Info */}
                          <div className="flex flex-col">
                            <p className="font-semibold text-sm text-gray-900">
                              {msg.fileName || "Document"}
                            </p>
                            {/* Optional: show file size or type */}
                            <p
                              className={
                                isCurrentUser ? "text-white" : "text-gray-700"
                              }
                            >
                              Tap to download
                            </p>
                          </div>
                        </div>
                      )}

                      {/* TEXT WITH MEDIA (Optional case: if you allow text + media) */}
                      {msg.message && msg.mediaUrl && (
                        <p
                          className={`mt-2 ${
                            isCurrentUser ? "text-white" : "text-black"
                          }`}
                        >
                          {msg.message}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={lastMessageRef}></div>
            </div>
          </div>

          {/* Footer (Fixed & Above Scroll) */}
          <div className="border-t border-gray-300 p-4 flex gap-4 items-center bg-white relative md:pb-20">
            {/* 📎 File Attach Icon */}
            <PaperClipIcon
              className={`h-6 w-6 cursor-pointer transition-all ${
                isUploading
                  ? "text-gray-300 animate-pulse cursor-not-allowed"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => {
                if (!isUploading) handleFileClick();
              }}
            />

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,video/*,application/pdf"
              multiple
              onChange={handleFileChange}
            />

            {/* Content wrapper */}
            <div className="flex-grow flex flex-wrap gap-4 items-center">
              {selectedFiles.length > 0 ? (
                // Selected files previews
                <div className="flex flex-wrap gap-4">
                  {selectedFiles.map(({ file, previewUrl }, index) => (
                    <div key={index} className="relative">
                      {/* Image Preview */}
                      {file.type.startsWith("image/") && (
                        <img
                          src={previewUrl}
                          alt={`Preview ${index}`}
                          className="h-16 w-16 object-cover rounded-md"
                        />
                      )}

                      {/* Video Preview */}
                      {file.type.startsWith("video/") && (
                        <video
                          src={previewUrl}
                          controls
                          className="h-16 w-16 rounded-md"
                        />
                      )}

                      {/* PDF Preview */}
                      {file.type.includes("pdf") && (
                        <div className="flex items-center bg-gray-100 px-4 py-2 rounded-md max-w-[200px] relative">
                          <span
                            className="text-sm font-medium truncate"
                            title={file.name}
                          >
                            {file.name}
                          </span>
                        </div>
                      )}

                      {/* ❌ Remove button */}
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                      >
                        <XMarkIcon className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                // Text message input
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={1}
                  placeholder="Send a message"
                  className="flex-grow border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800 resize-none"
                  onKeyDown={(e) => e.key === "Enter" && handleSendClick()}
                />
              )}
            </div>

            {/* Send Button */}
            <button
              onClick={handleSendClick}
              disabled={
                isUploading ||
                (selectedFiles.length === 0 && newMessage.trim() === "")
              }
              className={`bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-all ${
                isUploading ||
                (selectedFiles.length === 0 && newMessage.trim() === "")
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {isUploading ? "Sending..." : "Send"}
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
