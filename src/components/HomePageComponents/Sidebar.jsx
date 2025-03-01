import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";

const Sidebar = ({ handleSelectConversation }) => {
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState([]);

  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    fetchFriends(user);
  }, [user]);

  const fetchFriends = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${
          process.env.REACT_APP_SERVER_URL
        }/api/get-friends?uid=${encodeURIComponent(user.uid)}`,
        {
          method: "GET",
        }
      );

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

  return (
    <div className="w-full md:w-1/4 bg-gray-200 border-r border-gray-300 flex-grow">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col h-full">
        {/* Sidebar Header */}
        <div className="bg-gray-200 px-5 py-4 shadow-md">
          <h1 className="text-2xl font-bold text-gray-800">Chats</h1>
        </div>

        {/* Sidebar Content (Scrollable) */}
        <div className="flex-grow overflow-y-auto">
          {loading || friends.length === 0 ? (
            <div>
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center px-5 py-3 animate-pulse space-x-3"
                >
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0"></div>
                  <div className="flex flex-col space-y-1 ml-3 w-full">
                    <div className="w-24 h-4 bg-gray-300 rounded"></div>
                    <div className="w-16 h-3 bg-gray-300 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            friends.map((friend) => (
              <div
                key={friend.uid}
                className="flex items-center px-5 py-3 hover:bg-gray-300 cursor-pointer transition-all"
                onClick={() => handleSelectConversation(friend)}
              >
                {/* Placeholder for the image */}
                <img
                  src={friend.photoUrl}
                  alt="Friend"
                  className="w-10 h-10 rounded-full object-cover"
                />

                {/* Text content */}
                <div className="flex flex-col space-y-1 ml-3 w-full">
                  <div className="relative overflow-hidden whitespace-nowrap text-ellipsis">
                    <span
                      className="font-semibold text-gray-800 inline-block w-full"
                      title={friend.displayName || ""} // Ensure title is never null/undefined
                    >
                      {(friend.displayName?.length ?? 0) > 36
                        ? (friend.displayName || "").slice(0, 36) + "..." // Fixed null issue
                        : friend.displayName || ""}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {friend.lastMessage || "Start a conversation"}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className="w-full bg-gray-200 border-b border-gray-300 md:hidden fixed inset-0 z-10">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-gray-200 px-5 py-4 shadow-md flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">Chats</h1>
          </div>

          {/* Chat List */}
          <div className="flex-grow overflow-y-auto">
            {loading || friends.length === 0 ? (
              <div className="space-y-3 px-5 py-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-4 animate-pulse"
                  >
                    <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                    <div className="flex flex-col space-y-2">
                      <div className="w-32 h-4 bg-gray-300 rounded"></div>
                      <div className="w-20 h-3 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend.uid}
                  className="flex items-center px-5 py-4 rounded-lg transition-all duration-200 hover:bg-gray-300 active:bg-gray-400 cursor-pointer"
                  onClick={() => handleSelectConversation(friend)}
                >
                  {/* Profile Image */}
                  <img
                    src={friend.photoUrl}
                    alt={friend.displayName}
                    className="w-12 h-12 rounded-full object-cover"
                  />

                  {/* Friend Info */}
                  <div className="ml-3 flex flex-col">
                    <span className="font-semibold text-gray-800 text-lg">
                      {friend.displayName}
                    </span>
                    <span className="text-sm text-gray-500">
                      {friend.lastMessage || "Start a conversation"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
