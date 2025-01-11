    import React, { useState, useEffect, useRef } from "react";
    import { getAuth } from "firebase/auth";
    import Header from "../components/Navbar";
    import Footer from "../components/Footer";
    import socket from "../socket"; // Import the socket instance
    import { encryptMessage, decryptMessage } from "../functions/encryption"
    import { verifyOrGenerateKeysForUser, getPrivateKey } from "../functions/generateKeyPair"
    import { PhoneIcon, VideoCameraIcon, PaperClipIcon } from '@heroicons/react/24/outline';

    const Home = () => {
        const auth = getAuth();
        const curUser = auth.currentUser;
        const [friends, setFriends] = useState([]);
        const [activeConversation, setActiveConversation] = useState(null);
        const [loading, setLoading] = useState(false);
        const [messages, setMessages] = useState([]); // Store chat messages
        const [newMessage, setNewMessage] = useState(""); // Input for new message
        const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for sidebar visibility
        const [hasMore, setHasMore] = useState(true);
        const [page, setPage] = useState(1);
        const chatContainerRef = useRef(null);
        const lastMessageRef = useRef(null);

        useEffect(() => {
            if (curUser) {
                verifyOrGenerateKeysForUser(curUser.uid); // Ensure the user has a key pair
                fetchFriends(curUser);
            }

            // Listen for incoming messages
            socket.on("receiveMessage", async (message) => {
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
                socket.off("receiveMessage");
            };
        }, [curUser]);

        const fetchFriends = async (user) => {
            try {
                setLoading(true);
                const response = await fetch(`http://localhost:5000/api/get-friends?uid=${encodeURIComponent(user.uid)}`, {
                    method: "GET",
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch friends list");
                }

                const friendsList = await response.json();
                setFriends(friendsList);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching friends:", error);
                setLoading(false);
            }
        };

        
        const fetchMessages = async (page) => {
            try {
                const privateKey = await getPrivateKey(curUser.uid);
                const response = await fetch(
                    `http://localhost:5000/api/messages?userId1=${curUser.uid}&userId2=${activeConversation.uid}&page=${page}&limit=20`
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
        
        const handleSelectConversation = (friend) => {
            setActiveConversation(friend);
            setMessages([]); // Clear previous messages
            setPage(1);
            setHasMore(true);

            // Join a room with the friend
            socket.emit("joinRoom", {
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

        useEffect(() => {
            if (activeConversation) {
                fetchMessages(page);
            }
        }, [activeConversation, page]);

        const handleSendMessage = async () => {
            if (newMessage.trim() === "") return;
        
            try {
                // Fetch the recipient's public key
                const receiverKeyResponse = await fetch(`http://localhost:5000/api/getPublicKey/${activeConversation.uid}`);
                if (!receiverKeyResponse.ok) throw new Error("Failed to fetch receiver's public key");
                const { publicKey: receiverPublicKey } = await receiverKeyResponse.json();
        
                // Fetch the sender's public key
                const senderKeyResponse = await fetch(`http://localhost:5000/api/getPublicKey/${curUser.uid}`);
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
                socket.emit("sendMessage", message);
        
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
                                {/* Sidebar */}
                                <div className="w-1/4 bg-gray-200 border-r border-gray-300 flex-grow">
                                    <div className="flex flex-col h-full">
                                        {/* Sidebar Header */}
                                        <div className="bg-gray-200 px-5 py-4 shadow-md">
                                            <h1 className="text-2xl font-bold text-gray-800">Chats</h1>
                                        </div>

                                        {/* Sidebar Content (Scrollable) */}
                                        <div className="flex-grow overflow-y-auto">
                                            {loading ? (
                                                <div className="p-4 text-gray-600">Loading friends...</div>
                                            ) : (
                                                friends.map((friend) => (
                                                    <div
                                                        key={friend.uid}
                                                        className="flex items-center justify-between px-5 py-3 hover:bg-gray-300 cursor-pointer transition-all"
                                                        onClick={() => handleSelectConversation(friend)}
                                                    >
                                                        <div>
                                                            <div className="font-semibold text-gray-800">{friend.displayName}</div>
                                                            <div className="text-sm text-gray-500">{friend.lastMessage || "Start a conversation"}</div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Chat Window */}
                                <div className="w-3/4 flex h- flex-col flex-grow">
                                    {activeConversation ? (
                                        <>
                                            {/* Chat Header */}
                                            <div className="bg-white px-4 py-3 border-b border-gray-300 flex justify-between items-center">
                                                <div className="font-bold text-gray-800">{activeConversation.displayName}</div>
                                                <div className="flex items-center space-x-4">
                                                    <PhoneIcon className="h-6 w-6 text-gray-500 cursor-pointer hover:text-gray-700" />
                                                    <VideoCameraIcon className="h-6 w-6 text-gray-500 cursor-pointer hover:text-gray-700" />
                                                </div>
                                            </div>

                                            {/* Chat Content (Scrollable) */}
                                            <div
                                                className="flex-grow bg-gray-50 px-6 py-3 overflow-y-scroll max-h-[calc(100vh-233px)]"
                                                onScroll={handleScroll}
                                                ref={chatContainerRef}
                                            >
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
                                                <div ref={lastMessageRef}></div>
                                            </div>

                                            {/* Chat Footer */}
                                            <div className="border-t border-gray-300 p-4 flex gap-4 items-center fixed bottom-16 w-3/4 bg-white">
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
                            </div>


                            {/* Mobile View: No Sidebar, only Conversations and Chat Window */}
                            <div className="flex-1 md:hidden flex flex-col">
                                {/* Chat Window with Back Button */}
                                {activeConversation ? (
                                    <>
                                        <div className="bg-white px-6 py-4 border-b border-gray-300 flex items-center space-x-4">
                                            <button
                                                onClick={handleBackToConversations}
                                                className="text-2xl font-semibold text-gray-800 hover:text-gray-600 transition-all"
                                            >
                                                &#8592; {/* Left Arrow */}
                                            </button>
                                            <div className="font-semibold text-xl text-gray-800">{activeConversation.displayName}</div>
                                        </div>
                                        {/* Flex container for messages and input field */}
                                        <div className="flex flex-col flex-grow bg-gray-50 px-6 py-4">
                                            {/* Messages */}
                                            <div className="flex-1 overflow-y-auto space-y-4">
                                                {messages.map((msg, index) => (
                                                    <div
                                                        key={index}
                                                        className={`mb-2 ${msg.senderId === curUser.uid ? "text-right" : "text-left"}`}
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
                                            {/* Input and Send Button */}
                                            <div className="border-t border-gray-300 p-4 flex gap-4 mt-auto">
                                                <input
                                                    type="text"
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            handleSendMessage();
                                                        }
                                                    }}
                                                    placeholder="Type a message..."
                                                    className="flex-grow border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-700"
                                                />
                                                <button
                                                    onClick={handleSendMessage}
                                                    className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-all"
                                                >
                                                    Send
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full bg-gray-200 border-b border-gray-300 md:hidden">
                                        <div className="flex flex-col h-full">
                                            <div className="bg-gray-200 px-5 py-4 shadow-md">
                                                <h1 className="text-xl font-bold text-gray-800">Chats</h1>
                                            </div>
                                            <div className="flex-grow overflow-y-auto">
                                                {loading ? (
                                                    <div className="p-4 text-gray-600">Loading friends...</div>
                                                ) : (
                                                    friends.map((friend) => (
                                                        <div
                                                            key={friend.uid}
                                                            className="flex items-center justify-between px-5 py-3 hover:bg-gray-300 cursor-pointer transition-all"
                                                            onClick={() => handleSelectConversation(friend)}
                                                        >
                                                            <div>
                                                                <div className="font-semibold text-gray-800">{friend.displayName}</div>
                                                                <div className="text-sm text-gray-500">{friend.lastMessage || "Start a conversation"}</div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
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
