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
import { getPrivateKey } from "../../functions/generateKeyPair.js";
import { importRSAPrivateKey } from "../../functions/fileEncryption.js";
import { Download, Share2 } from "lucide-react";

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
  const [fullscreenMedia, setFullscreenMedia] = useState(null);

  useEffect(() => {
    if (!messages || messages.length === 0) return;

    const decryptFiles = async () => {
      const updatedMessages = await Promise.all(
        messages.map(async (msg, index) => {
          if (!msg.mediaUrl || !msg.iv) {
            return msg; // No encrypted media, just return as-is
          }

          try {
            // --- Step 1: Decrypt the AES key using your private RSA key ---
            const encryptedAESKeyBase64 =
              curUser.uid === msg.senderId
                ? msg.encryptedAESKeyS
                : msg.encryptedAESKeyR;

            if (!encryptedAESKeyBase64) {
              console.warn(
                `No encrypted AES key found for message ${msg.id || index}`
              );
              return msg;
            }

            const encryptedAESKeyBuffer = base64ToArrayBuffer(
              encryptedAESKeyBase64
            );

            // Import your RSA private key (replace this with your actual import method)
            const privateKey = await importRSAPrivateKey(
              getPrivateKey(curUser.uid)
            ); // <-- YOU NEED TO IMPLEMENT THIS PART
            console.log("privateKey", privateKey);
            const decryptedAESKeyBuffer = await window.crypto.subtle.decrypt(
              {
                name: "RSA-OAEP",
                hash: "SHA-256",
              },
              privateKey,
              encryptedAESKeyBuffer
            );

            // --- Step 2: Import the decrypted AES key for decryption ---
            const aesKey = await window.crypto.subtle.importKey(
              "raw",
              decryptedAESKeyBuffer,
              "AES-GCM",
              true,
              ["decrypt"]
            );

            // --- Step 3: Fetch and decrypt the encrypted file ---
            const response = await fetch(msg.mediaUrl);
            const encryptedArrayBuffer = await response.arrayBuffer();

            const ivBuffer = base64ToArrayBuffer(msg.iv);

            const decryptedArrayBuffer = await window.crypto.subtle.decrypt(
              {
                name: "AES-GCM",
                iv: ivBuffer,
              },
              aesKey,
              encryptedArrayBuffer
            );

            // --- Step 4: Create Blob and URL ---
            const mimeType = getMimeTypeFromType(msg.mediaType);
            const decryptedBlob = new Blob([decryptedArrayBuffer], {
              type: mimeType,
            });
            const decryptedUrl = URL.createObjectURL(decryptedBlob);

            // Return the updated message with decrypted URL
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

      // Update state with decrypted messages and media items
      setDecryptedMessages(updatedMessages);

      const decryptedMediaItems = updatedMessages
        .filter((msg) => msg.decryptedUrl)
        .map((msg, index) => ({
          id: msg.id || index,
          type: msg.mediaType || getFileType(msg.mediaUrl),
          fileName: msg.originalFileName,
          url: msg.decryptedUrl,
          createdAt: msg.createdAt,
        }));

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

  const downloadFile = async (url, filename) => {
    try {
      const response = await fetch(url, { mode: "cors" }); // mode may vary based on CORS policy
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename || "download"; // Optional custom name
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleShare = async (url) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check this out!",
          text: "Here's a cool file for you!",
          url: url,
        });
        console.log("Shared successfully");
      } catch (error) {
        console.error("Error sharing", error);
      }
    } else {
      alert("Web Share API not supported in this browser.");
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

          {/* Chat Messages Container */}
          <div className="flex flex-col flex-grow overflow-hidden relative">
            {/* ✅ MediaGallery overlay */}
            <div className="absolute top-0 right-0 z-20">
              <div className="flex flex-col items-center rounded-lg bg-white/10 backdrop-blur-md pb-2 hover:bg-white/40 transition-all">
                <p className>Media</p>
                <MediaGallery
                  mediaItems={mediaItems}
                  setFullscreenMedia={setFullscreenMedia} // pass setter down
                />
              </div>
            </div>

            {/* ✅ Chat messages container (scrollable) */}
            <div
              ref={chatContainerRef}
              onScroll={handleScroll}
              className="flex-grow overflow-y-auto p-4 h-0"
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
          <div className="border-t border-gray-300 p-4 flex gap-4 items-center bg-white relative">
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
      {/* Fullscreen Media Viewer */}
      {fullscreenMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center p-4">
            {/* Close Button */}
            <button
              onClick={() => setFullscreenMedia(null)}
              className="absolute top-4 right-4 text-white bg-gray-700 bg-opacity-70 hover:bg-opacity-100 p-2 rounded-full"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>

            {/* Media Display */}
            {fullscreenMedia.type === "image" ? (
              <img
                src={fullscreenMedia.url}
                alt="Fullscreen Media"
                className="max-w-full max-h-full object-contain rounded"
              />
            ) : (
              <video
                src={fullscreenMedia.url}
                controls
                autoPlay
                className="max-w-full max-h-full rounded"
              />
            )}

            {/* Buttons */}
            <div className="absolute bottom-8 flex gap-4">
              <button
                onClick={() =>
                  downloadFile(fullscreenMedia.url, fullscreenMedia.name)
                }
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:bg-gray-200 px-4 py-2 rounded shadow-md transition"
              >
                <Download className="h-4 w-4 text-blue-600" />
                Download
              </button>

              <button
                onClick={() => handleShare(fullscreenMedia.url)}
                className="flex items-center gap-2 text-green-500 hover:bg-gray-200 px-4 py-2 rounded shadow-md transition"
              >
                <Share2 className="h-4 w-4 text-green-500" />
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
