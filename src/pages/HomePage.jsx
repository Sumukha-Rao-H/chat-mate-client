import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import Header from "../components/Navbar";
import Footer from "../components/Footer";
import socket from "../socket"; // Import the socket instance

const Home = () => {
    const auth = getAuth();
    const curUser = auth.currentUser;
    const [friends, setFriends] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState([]); // Store chat messages
    const [newMessage, setNewMessage] = useState(""); // Input for new message
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for sidebar visibility

    useEffect(() => {
        if (curUser) {
            fetchFriends(curUser);
        }

        // Listen for incoming messages
        socket.on("receiveMessage", (message) => {
            // Only add the message if it's from another user
            if (message.senderId !== curUser.uid) {
                setMessages((prevMessages) => [...prevMessages, message]);
            }
        });

        return () => {
            socket.off("receiveMessage"); // Clean up event listener
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

    const handleSelectConversation = (friend) => {
        setActiveConversation(friend);
        setMessages([]); // Clear previous messages

        // Join a room with the friend
        socket.emit("joinRoom", {
            senderId: curUser.uid,
            receiverId: friend.uid,
        });
    };

    const handleSendMessage = () => {
        if (newMessage.trim() === "") return;

        const message = {
            senderId: curUser.uid,
            receiverId: activeConversation.uid,
            message: newMessage,
        };

        // Send the message via Socket.IO
        socket.emit("sendMessage", message);

        // Add the message to local state
        setMessages((prevMessages) => [...prevMessages, message]);
        setNewMessage(""); // Clear input field
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
            <div className="flex flex-col min-h-screen bg-gray-50">
                <div className="flex-grow flex flex-col pt-12">
                    <div className="flex flex-grow">
                        {/* Desktop View: Sidebar and Chat Window */}
                        <div className="hidden md:flex flex-grow">
                            {/* Sidebar */}
                            <div className="w-1/4 bg-gray-200 border-r border-gray-300 h-auto md:h-screen">
                                <div className="flex flex-col h-full">
                                    <div className="bg-gray-200 px-5 py-4 shadow-md">
                                        <h1 className="text-2xl font-bold text-gray-800">Chats</h1>
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

                            {/* Chat Window */}
                            <div className="flex-1 flex flex-col w-3/4 bg-white px-6 py-4 overflow-y-auto">
                                {activeConversation ? (
                                    <>
                                        <div className="bg-white px-4 py-3 border-b border-gray-300 flex justify-between items-center">
                                            <div className="font-bold text-gray-800">{activeConversation.displayName}</div>
                                        </div>
                                        <div className="flex-1 bg-gray-50 px-6 py-4 overflow-y-auto">
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
