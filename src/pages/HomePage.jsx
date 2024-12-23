import React from 'react';
import { useAuth } from '../context/authContext/index';
import Header from "../components/Navbar";
import Footer from "../components/Footer";

const Home = () => {
    const { currentUser } = useAuth();

    if (!currentUser) {
        return <div>Loading...</div>;
    }

    const conversations = [
        { name: "Annie Carpenter", lastMessage: "Did you talk to Mark? 😄", time: "10:37AM" },
        { name: "Mark Appleyard", lastMessage: "Lunch tomorrow. I'll call you", time: "2:31AM" },
        { name: "Bradley Stokes", lastMessage: "Sent a photo", time: "2 DEC" },
        { name: "Emilie Wagner", lastMessage: "You: I'm there in 10 min", time: "2 DEC" },
        { name: "Lewis Butler", lastMessage: "👋", time: "2 DEC" },
        { name: "Jeff Ballard", lastMessage: "Nice, let's talk on Tuesday. 😄", time: "2 DEC" },
        { name: "Delia Nelson", lastMessage: "You: lol", time: "3 DEC" },
        { name: "Juan Robbins", lastMessage: "Hi", time: "3 DEC" },
    ];

    const messages = [
        { sender: "other", text: "Yes. Should we move it to next week?", time: "DECEMBER 5" },
        { sender: "me", text: "Sure, whatever suits you. 😃 I'm free whenever 🕒", time: "" },
        { sender: "other", text: "And I'll update the calendar. I thought I already updated it.", time: "" },
        { sender: "me", text: "It's all good fam.", time: "" },
        { sender: "other", text: "I rescheduled it to every first Wednesday in the month. But we can do it next week whenever you want?", time: "" },
        { sender: "me", text: "Cool bro. ✌ Next Thursday at about 13:00?", time: "" },
        { sender: "other", text: "Ok, I'll let you know.", time: "" },
    ];

    return (
        <>
            <Header />
            <div className="flex flex-col min-h-screen bg-gray-50">
                {/* Main Content */}
                <div className="flex-grow flex flex-col pt-12">
                    <div className="flex flex-grow">
                        {/* Chat Sidebar */}
                        <div className="w-full md:w-1/3 bg-gray-200 border-r border-gray-300 h-auto md:h-screen">
                            <div className="flex flex-col h-full">
                                <div className="bg-gray-200 px-5 py-4 shadow-md">
                                    <h1 className="text-2xl font-bold text-gray-800">Chats</h1>
                                </div>
                                <div className="flex-grow overflow-y-auto">
                                    {conversations.map((conversation, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between px-5 py-3 hover:bg-gray-300 cursor-pointer transition-all"
                                        >
                                            <div>
                                                <div className="font-semibold text-gray-800">{conversation.name}</div>
                                                <div className="text-sm text-gray-500">{conversation.lastMessage}</div>
                                            </div>
                                            <div className="text-xs text-gray-400">{conversation.time}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
    
                        {/* Chat Window */}
                        <div className="hidden md:flex w-full md:w-2/3 flex-col pb-10">
                            <div className="bg-white px-4 py-3 border-b border-gray-300 flex justify-between items-center">
                                <div className="font-bold text-gray-800">Mark Appleyard</div>
                                <div className="text-gray-500 text-sm">Last active: 2:31AM</div>
                            </div>
                            <div className="flex-1 bg-gray-50 px-6 py-4 overflow-y-auto">
                                {messages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`flex ${
                                            message.sender === "me" ? "justify-end" : "justify-start"
                                        } mb-4`}
                                    >
                                        <div
                                            className={`p-3 rounded-lg ${
                                                message.sender === "me"
                                                    ? "bg-gray-500 text-white"
                                                    : "bg-gray-300 text-gray-800"
                                            }`}
                                        >
                                            {message.text}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-gray-300 p-4">
                                <input
                                    type="text"
                                    placeholder="Send a message"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
                                />
                            </div>
                        </div>
                    </div>
                </div>
    
                {/* Footer */}
                <Footer />
            </div>
        </>
    );
};

export default Home;
