import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const ChatPage = ({ currentUserId, chatPartnerId }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:3000', {
      query: { userId: currentUserId },
    });
    setSocket(newSocket);

    // Event listener for receiving messages
    newSocket.on('receive_message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Clean up the socket connection
    return () => {
      newSocket.disconnect();
    };
  }, [currentUserId]);

  const handleSendMessage = () => {
    if (newMessage.trim() && socket) {
      const messageData = {
        senderId: currentUserId,
        receiverId: chatPartnerId,
        content: newMessage.trim(),
        timestamp: new Date(),
      };

      // Emit the message to the server
      socket.emit('send_message', messageData);

      // Add the message to the UI
      setMessages((prevMessages) => [...prevMessages, messageData]);
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-blue-500 text-white py-4 px-6 text-lg font-bold shadow">
        Chat with User {chatPartnerId}
      </header>
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.senderId === currentUserId ? 'justify-end' : 'justify-start'
            } mb-4`}
          >
            <div
              className={`px-4 py-2 rounded-lg max-w-xs ${
                message.senderId === currentUserId
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-300 text-gray-800'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>
      <footer className="flex items-center p-4 bg-white border-t">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSendMessage}
          className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Send
        </button>
      </footer>
    </div>
  );
};

export default ChatPage;
