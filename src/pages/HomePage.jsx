    import React, { useState, useEffect, useRef } from "react";
    import { getAuth } from "firebase/auth";
    import Header from "../components/Navbar";
    import Footer from "../components/Footer";
    import chatSocket from "../sockets/chatSocket"; // Import the socket instance
    import Sidebar from "../components/HomePageComponents/Sidebar";
    import ChatWindow from "../components/HomePageComponents/ChatWindow";
    import { encryptMessage, decryptMessage } from "../functions/encryption"
    import { verifyOrGenerateKeysForUser, getPrivateKey } from "../functions/generateKeyPair"

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
                        const decryptedMessage = await decryptMessage(privateKey, message.messageR);
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
                            console.log(`Message ${index + 1} does not belong to this conversation`);
                            return { ...msg, message: "Message not available" }; // Fallback
                        }
        
                        // Check if the message is encrypted
                        if (!encryptedMessage) {
                            console.log(`Message is missing for message ${index + 1}`);
                            return { ...msg, message: "Message not available" }; // Fallback
                        }
                        const decryptedMessage = await decryptMessage(privateKey, encryptedMessage);
                        return {
                            ...msg,
                            message: decryptedMessage,
                        };
                    })
                );
        
                setMessages((prevMessages) => [...decryptedMessages.reverse(), ...prevMessages]);
                setHasMore(data.hasMore);
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };

        const scrollToBottom = () => {
            if (chatContainerRef.current) {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            }
        };
        
        useEffect(() => {
            if (messages.length > 0 || activeConversation) {
                scrollToBottom();
            }
        }, [messages, activeConversation]);
        
        useEffect(() => {
            if(activeConversation) {
                fetchMessages(page);
            }
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
            if (
                chatContainerRef.current.scrollTop === 0 &&
                hasMore &&
                !loading
            ) {
                setPage((prevPage) => prevPage + 1);
            }
        };

        const handleSendMessage = async () => {
            if (newMessage.trim() === "") return;
        
            try {
                // Fetch the recipient's public key
                const receiverKeyResponse = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/getPublicKey/${activeConversation.uid}`);
                if (!receiverKeyResponse.ok) throw new Error("Failed to fetch receiver's public key");
                const { publicKey: receiverPublicKey } = await receiverKeyResponse.json();
        
                // Fetch the sender's public key
                const senderKeyResponse = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/getPublicKey/${curUser.uid}`);
                if (!senderKeyResponse.ok) throw new Error("Failed to fetch sender's public key");
                const { publicKey: senderPublicKey } = await senderKeyResponse.json();
        
                // Encrypt the message with the recipient's public key (messageR)
                const encryptedMessageR = await encryptMessage(receiverPublicKey, newMessage);
        
                // Encrypt the message with the sender's public key (messageS)
                const encryptedMessageS = await encryptMessage(senderPublicKey, newMessage);
        
                const message = {
                    senderId: curUser.uid,
                    receiverId: activeConversation.uid,
                    messageS: encryptedMessageS,
                    messageR: encryptedMessageR,
                };
        
                // Emit the message to the backend
                chatSocket.emit("sendMessage", message);
        
                // Add the original message to the local state for display purposes
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { ...message, message: newMessage },
                ]);
                setNewMessage("");

                if (lastMessageRef.current) {
                    lastMessageRef.current.scrollIntoView({
                        behavior: "smooth",
                        block: "end",
                    });
                }
                scrollToBottom();
            } catch (error) {
                console.error("Error sending message:", error);
            }
        };
        

        const handleBackToConversations = () => {
            setActiveConversation(null); // Reset the active conversation
            setMessages([]); // Clear messages
        };

        if (!curUser) {
            return <div>Loading...</div>;
        }

        return (
            <>
                <Header />
                <div className="flex flex-col min-h-screen overflow-hidden bg-gray-50">
                    <div className="flex flex-col pt-12">
                        <div className="flex">
                            {/* Desktop View: Sidebar and Chat Window */}
                            <div className="hidden md:flex w-full h-screen">
                                <Sidebar 
                                    handleSelectConversation={handleSelectConversation}
                                />

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
                                    <Sidebar 
                                        handleSelectConversation={handleSelectConversation}
                                    />
                                )}
                            </div>

                        </div>
                    </div>
                    <Footer />
                </div>
            </>
        );
    };

    export default Home;
