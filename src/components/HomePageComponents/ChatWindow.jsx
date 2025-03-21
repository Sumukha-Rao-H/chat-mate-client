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
  const [decryptedMessages, setDecryptedMessages] = useState([]);

  // useEffect(() => {
  //   if (!messages || messages.length === 0) {
  //     setMediaItems([]); // No messages
  //     return;
  //   }

  //   const decryptFiles = async () => {
  //     const decryptedMediaItems = [];

  //     for (const [index, msg] of messages.entries()) {
  //       if (!msg.mediaUrl || !msg.rawAESKey || !msg.iv) continue;

  //       try {
  //         // Step 1: Fetch encrypted file as ArrayBuffer
  //         const response = await fetch(msg.mediaUrl);
  //         const encryptedArrayBuffer = await response.arrayBuffer();

  //         // Step 2: Convert rawAESKey (Base64) back to ArrayBuffer
  //         const rawAESKeyBuffer = base64ToArrayBuffer(msg.rawAESKey);

  //         // Step 3: Import AES key
  //         const aesKey = await window.crypto.subtle.importKey(
  //           "raw",
  //           rawAESKeyBuffer,
  //           "AES-GCM",
  //           true,
  //           ["decrypt"]
  //         );

  //         // Step 4: Convert IV from Base64 to ArrayBuffer
  //         const ivBuffer = base64ToArrayBuffer(msg.iv);

  //         // Step 5: Decrypt file
  //         const decryptedArrayBuffer = await window.crypto.subtle.decrypt(
  //           {
  //             name: "AES-GCM",
  //             iv: ivBuffer,
  //           },
  //           aesKey,
  //           encryptedArrayBuffer
  //         );

  //         // Step 6: Create Blob and Object URL from decrypted data
  //         const mimeType = getMimeTypeFromType(msg.mediaType);
  //         const decryptedBlob = new Blob([decryptedArrayBuffer], {
  //           type: mimeType,
  //         });
  //         const decryptedUrl = URL.createObjectURL(decryptedBlob);

  //         // Step 7: Push to mediaItems array
  //         decryptedMediaItems.push({
  //           id: msg.id || index,
  //           type: msg.mediaType || getFileType(msg.mediaUrl),
  //           url: decryptedUrl,
  //           createdAt: msg.createdAt,
  //         });
  //       } catch (err) {
  //         console.error(
  //           `Failed to decrypt file for message ${msg.id || index}:`,
  //           err
  //         );
  //       }
  //     }

  //     // Optional: Sort by date, latest first, and reverse if needed
  //     decryptedMediaItems.sort((a, b) => {
  //       const dateA = new Date(a.createdAt).getTime();
  //       const dateB = new Date(b.createdAt).getTime();
  //       return dateB - dateA; // Descending
  //     });

  //     setMediaItems(decryptedMediaItems.reverse()); // Optional: reverse for oldest first
  //   };

  //   decryptFiles();
  // }, [messages]);

  useEffect(() => {
    if (!messages || messages.length === 0) return;

    const decryptFiles = async () => {
      const updatedMessages = await Promise.all(
        messages.map(async (msg, index) => {
          if (!msg.mediaUrl || !msg.rawAESKey || !msg.iv) {
            return msg; // No encrypted media, just return as-is
          }

          try {
            const response = await fetch(msg.mediaUrl);
            const encryptedArrayBuffer = await response.arrayBuffer();

            const rawAESKeyBuffer = base64ToArrayBuffer(msg.rawAESKey);
            const aesKey = await window.crypto.subtle.importKey(
              "raw",
              rawAESKeyBuffer,
              "AES-GCM",
              true,
              ["decrypt"]
            );

            const ivBuffer = base64ToArrayBuffer(msg.iv);

            const decryptedArrayBuffer = await window.crypto.subtle.decrypt(
              {
                name: "AES-GCM",
                iv: ivBuffer,
              },
              aesKey,
              encryptedArrayBuffer
            );

            const mimeType = getMimeTypeFromType(msg.mediaType);
            const decryptedBlob = new Blob([decryptedArrayBuffer], {
              type: mimeType,
            });
            const decryptedUrl = URL.createObjectURL(decryptedBlob);

            // Add decrypted URL to the message object
            return {
              ...msg,
              decryptedUrl,
            };
          } catch (err) {
            console.error(
              `Failed to decrypt media for message ${msg.id || index}:`,
              err
            );
            return msg; // Return original message on failure
          }
        })
      );

      setDecryptedMessages(updatedMessages); // Set your new enriched array
      const decryptedMediaItems = updatedMessages
        .filter((msg) => msg.decryptedUrl) // Only messages with decrypted media
        .map((msg, index) => ({
          id: msg.id || index,
          type: msg.mediaType || getFileType(msg.mediaUrl),
          url: msg.decryptedUrl,
          createdAt: msg.createdAt,
        }));

      // Optional: Sort by date, latest first
      decryptedMediaItems.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Descending order
      });

      setMediaItems(decryptedMediaItems.reverse());
    };

    decryptFiles();
  }, [messages]);

  function base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  function getMimeTypeFromType(type) {
    switch (type) {
      case "image":
        return "image/png"; // or jpeg, depends on your file type
      case "video":
        return "video/mp4";
      case "document":
        return "application/pdf"; // example
      default:
        return "application/octet-stream";
    }
  }

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
  }, [decryptedMessages]);

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
          <div className="flex flex-col flex-grow overflow-hidden relative">
            {/* ✅ MediaGallery overlay */}
            <div className="absolute top-4 right-4 z-20">
              <div className="flex flex-col items-center rounded-lg bg-white/10 backdrop-blur-md pb-2 hover:bg-white/40 transition-all">
                <p className>Media</p>
                <MediaGallery mediaItems={mediaItems} />
              </div>
            </div>

            {/* ✅ Chat messages container (scrollable) */}
            <div
              ref={chatContainerRef}
              onScroll={handleScroll}
              className="flex-grow overflow-y-auto p-4"
              style={{ maxHeight: "calc(100vh - 128px)" }}
            >
              {decryptedMessages.map((msg, index) => {
                const isCurrentUser = msg.senderId === curUser.uid;
                const isTextOnly = !!msg.message && !msg.decryptedUrl;

                return (
                  <div
                    key={index}
                    className={`mb-4 flex ${
                      isCurrentUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div className="max-w-xs break-words text-sm">
                      {/* TEXT MESSAGE */}
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
                      {msg.mediaType === "image" && msg.decryptedUrl && (
                        <img
                          src={msg.decryptedUrl}
                          alt="Sent media"
                          className="max-w-full h-auto rounded-lg mt-2 cursor-pointer border"
                          onClick={() =>
                            window.open(msg.decryptedUrl, "_blank")
                          }
                        />
                      )}

                      {/* VIDEO MESSAGE */}
                      {msg.mediaType === "video" && msg.decryptedUrl && (
                        <video
                          controls
                          className="max-w-full h-auto rounded-lg mt-2 border"
                        >
                          <source src={msg.decryptedUrl} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      )}

                      {/* DOCUMENT MESSAGE */}
                      {msg.mediaType === "document" && msg.decryptedUrl && (
                        <div
                          className={`flex items-center gap-4 p-3 rounded-lg border ${
                            isCurrentUser
                              ? "bg-gray-500 text-white"
                              : "bg-gray-200 text-gray-800"
                          } mt-2 shadow-sm cursor-pointer hover:shadow-md transition`}
                          onClick={() =>
                            window.open(msg.decryptedUrl, "_blank")
                          }
                        >
                          <div className="text-4xl text-blue-600">📄</div>
                          <div className="flex flex-col max-w-[200px] overflow-hidden">
                            <p
                              className={`font-semibold text-sm ${
                                isCurrentUser ? "text-white" : "text-gray-900"
                              } break-words`}
                              title={msg.originalFileName || "Document"}
                            >
                              {msg.originalFileName || "Document"}
                            </p>
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

                      {/* TEXT + MEDIA */}
                      {msg.message && msg.decryptedUrl && (
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

              {/* Last message ref for scroll to bottom */}
              <div ref={lastMessageRef} />
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
