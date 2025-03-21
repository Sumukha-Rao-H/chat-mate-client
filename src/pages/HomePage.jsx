import React, { useState, useEffect, useRef } from "react";
import { getAuth } from "firebase/auth";
import chatSocket from "../sockets/chatSocket"; // Import the socket instance
import Sidebar from "../components/HomePageComponents/Sidebar";
import ChatWindow from "../components/HomePageComponents/ChatWindow";
import { encryptMessage, decryptMessage } from "../functions/encryption";
import {
  verifyOrGenerateKeysForUser,
  getPrivateKey,
} from "../functions/generateKeyPair";
import {
  generateAESKey,
  encryptFileWithAES,
  exportAESKey,
  encryptAESKeyWithRSA,
  createEncryptedBlob,
} from "../functions/fileEncryption";

const Home = () => {
  const auth = getAuth();
  const curUser = auth.currentUser;
  const [activeConversation, setActiveConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]); // Store chat messages
  const [newMessage, setNewMessage] = useState(""); // Input for new message
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const chatContainerRef = useRef(null);
  const lastMessageRef = useRef(null);

  useEffect(() => {
    if (curUser) {
      verifyOrGenerateKeysForUser(curUser.uid); // Ensure the user has a key pair
    }

    // Listen for incoming messages
    chatSocket.on("receiveMessage", async (message) => {
      try {
        if (message.senderId !== curUser.uid) {
          // Decrypt the message using the private key
          const privateKey = await getPrivateKey(curUser.uid);
          const decryptedMessage = await decryptMessage(
            privateKey,
            message.messageR
          );
          setMessages((prevMessages) => [
            ...prevMessages,
            { ...message, message: decryptedMessage }, // Update with decrypted content
          ]);
        }
      } catch (error) {
        console.error("Error decrypting message:", error);
      }
    });

    return () => {
      chatSocket.off("receiveMessage");
    };
  }, [curUser]);

  const fetchMessages = async (page) => {
    try {
      const privateKey = await getPrivateKey(curUser.uid);
      const response = await fetch(
        `${process.env.REACT_APP_SERVER_URL}/api/messages?userId1=${curUser.uid}&userId2=${activeConversation.uid}&page=${page}&limit=20`
      );
      if (!response.ok) throw new Error("Failed to fetch messages");
      const data = await response.json();

      const decryptedMessages = await Promise.all(
        data.messages.map(async (msg, index) => {
          let encryptedMessage;

          if (msg.senderId === curUser.uid) {
            // Current user is the sender; use messageS
            encryptedMessage = msg.messageS;
          } else if (msg.receiverId === curUser.uid) {
            // Current user is the receiver; use messageR
            encryptedMessage = msg.messageR;
          } else {
            console.log(
              `Message ${index + 1} does not belong to this conversation`
            );
            return { ...msg, message: "Message not available" }; // Fallback
          }

          const decryptedMessage = await decryptMessage(
            privateKey,
            encryptedMessage
          );
          return {
            ...msg,
            message: decryptedMessage,
          };
        })
      );

      setMessages((prevMessages) => [
        ...decryptedMessages.reverse(),
        ...prevMessages,
      ]);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current && lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (messages.length > 0 || activeConversation) {
      scrollToBottom();
    }
  }, [messages, activeConversation]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(page);
    }
    // console.log("🔹 Active Conversation updated:", activeConversation);
  }, [activeConversation, page]);

  const handleSelectConversation = (friend) => {
    setActiveConversation(friend);
    setMessages([]); // Clear previous messages
    setPage(1);
    setHasMore(true);

    // Join a room with the friend
    chatSocket.emit("joinRoom", {
      senderId: curUser.uid,
      receiverId: friend.uid,
    });
    scrollToBottom();
  };

  const handleScroll = () => {
    if (chatContainerRef.current.scrollTop === 0 && hasMore && !loading) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  const handleSendMessage = async ({ textMessage = "", files = [] }) => {
    if ((!textMessage || textMessage.trim() === "") && files.length === 0) {
      console.warn("No message or files to send.");
      return;
    }

    try {
      // Get receiver and sender public keys (only need this if sending text)
      let receiverPublicKey = null;
      let senderPublicKey = null;

      const receiverKeyResponse = await fetch(
        `${process.env.REACT_APP_SERVER_URL}/api/getPublicKey/${activeConversation.uid}`
      );
      if (!receiverKeyResponse.ok)
        throw new Error("Failed to fetch receiver's public key");
      receiverPublicKey = (await receiverKeyResponse.json()).publicKey;

      const senderKeyResponse = await fetch(
        `${process.env.REACT_APP_SERVER_URL}/api/getPublicKey/${curUser.uid}`
      );
      if (!senderKeyResponse.ok)
        throw new Error("Failed to fetch sender's public key");
      senderPublicKey = (await senderKeyResponse.json()).publicKey;

      if (textMessage.trim() !== "") {

        // Encrypt the message for both sender and receiver
        const encryptedMessageR = await encryptMessage(
          receiverPublicKey,
          textMessage
        );
        const encryptedMessageS = await encryptMessage(
          senderPublicKey,
          textMessage
        );

        const messagePayload = {
          senderId: curUser.uid,
          receiverId: activeConversation.uid,
          messageS: encryptedMessageS,
          messageR: encryptedMessageR,
        };

        // Emit text message
        chatSocket.emit("sendMessage", messagePayload);

        // Update local messages
        setMessages((prev) => [
          ...prev,
          { ...messagePayload, message: textMessage },
        ]);
      }

      // Handle sending files if there are any
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileObj = file.file;
      
          try {
            // Step 1: Generate AES key
            const aesKey = await generateAESKey();
      
            // Step 2: Encrypt the file with AES key
            const { encryptedContent, iv } = await encryptFileWithAES(
              fileObj,
              aesKey
            );
      
            // Step 3: Export the raw AES key
            const rawAesKey = await exportAESKey(aesKey);
      
            // -- Commenting out RSA encryption for now --
            // const encryptedAESKeyR = await encryptAESKeyWithRSA(
            //   receiverPublicKey,
            //   rawAesKey
            // );
      
            // const encryptedAESKeyS = await encryptAESKeyWithRSA(
            //   senderPublicKey,
            //   rawAesKey
            // );
      
            // Step 4: Create a Blob from encrypted content for upload
            const encryptedBlob = createEncryptedBlob(encryptedContent);
      
            // Step 5: Prepare form data for Cloudinary upload
            const formData = new FormData();
            formData.append("file", encryptedBlob, fileObj.name);
            formData.append(
              "upload_preset",
              process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET
            );
      
            let uploadEndpoint = `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/raw/upload`;
            let mediaType = "";
      
            if (fileObj.type.startsWith("image/")) {
              mediaType = "image";
            } else if (fileObj.type.startsWith("video/")) {
              mediaType = "video";
            } else {
              mediaType = "document";
            }
      
            // Step 6: Upload encrypted blob to Cloudinary
            const response = await fetch(uploadEndpoint, {
              method: "POST",
              body: formData,
            });
      
            if (!response.ok) {
              console.error(`Upload failed for file ${fileObj.name}`);
              continue;
            }
      
            const data = await response.json();
            const uploadedFileUrl = data.secure_url;
      
            if (!uploadedFileUrl) {
              console.error(`No URL returned for file: ${fileObj.name}`);
              continue;
            }
      
            console.log("Raw AES Key (Base64):", arrayBufferToBase64(rawAesKey));
      
            // Step 7: Send the file message with raw AES key (testing purpose)
            const message = {
              senderId: curUser.uid,
              receiverId: activeConversation.uid,
              mediaUrl: uploadedFileUrl,
              mediaType: mediaType,
              encryptedAESKeyS: null, // Skipping RSA encryption
              encryptedAESKeyR: null, // Skipping RSA encryption
              rawAESKey: arrayBufferToBase64(rawAesKey), // For testing purposes only!
              iv: arrayBufferToBase64(iv),
              originalFileName: fileObj.name,
            };
      
            // Emit encrypted file message
            chatSocket.emit("sendMessage", message);
      
            // Update local messages UI
            setMessages((prev) => [...prev, { ...message }]);
          } catch (err) {
            console.error(`Error encrypting or uploading file: ${fileObj.name}`, err);
          }
        }
      }
      

      //   setNewMessage(""); // clear input field
      scrollToBottom(); // or whatever your scrolling function is
    } catch (error) {
      console.error("Error sending message or file:", error);
    }
  };

  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary);
  }

  const handleBackToConversations = () => {
    setActiveConversation(null); // Reset the active conversation
    setMessages([]); // Clear messages
  };

  if (!curUser) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
        <div className="flex flex-col flex-grow pt-12 ">
          <div className="flex flex-grow">
            {/* Desktop View: Sidebar and Chat Window */}
            <div className="hidden md:flex w-full">
              <Sidebar handleSelectConversation={handleSelectConversation} />

              <ChatWindow
                activeConversation={activeConversation}
                messages={messages}
                curUser={curUser}
                handleScroll={handleScroll}
                chatContainerRef={chatContainerRef}
                lastMessageRef={lastMessageRef}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                handleSendMessage={handleSendMessage}
                fetchMessages={fetchMessages}
                page={page}
              />
            </div>

            {/* Mobile View: No Sidebar, only Conversations and Chat Window */}
            <div className="flex-1 md:hidden flex flex-col">
              {/* Chat Window with Back Button */}
              {activeConversation ? (
                <>
                  <ChatWindow
                    activeConversation={activeConversation}
                    messages={messages}
                    curUser={curUser}
                    handleScroll={handleScroll}
                    chatContainerRef={chatContainerRef}
                    lastMessageRef={lastMessageRef}
                    newMessage={newMessage}
                    setNewMessage={setNewMessage}
                    handleSendMessage={handleSendMessage}
                    fetchMessages={fetchMessages}
                    page={page}
                    handleBackToConversations={handleBackToConversations}
                  />
                </>
              ) : (
                <Sidebar handleSelectConversation={handleSelectConversation} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
