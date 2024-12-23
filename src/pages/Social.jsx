import React, { useState } from "react";
import Header from "../components/Navbar";
import Footer from "../components/Footer";

// Mock user data
const allUsers = [
  { id: 6, name: "Alice Johnson" },
  { id: 7, name: "Chris Evans" },
  { id: 8, name: "Tom Holland" },
];

const Social = () => {
  const [activeTab, setActiveTab] = useState("Friends");
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [friends, setFriends] = useState([
    { id: 1, name: "John Doe" },
    { id: 2, name: "Jane Smith" },
    { id: 3, name: "Michael Brown" },
  ]);
  const [incomingRequests, setIncomingRequests] = useState([
    { id: 4, name: "Emily Clark" },
    { id: 5, name: "Daniel Wilson" },
  ]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim() === "") {
      setSearchResults([]);
      return;
    }
    const results = allUsers.filter((user) =>
      user.name.toLowerCase().includes(e.target.value.toLowerCase())
    );
    setSearchResults(results);
  };

  const handleSendRequest = (user) => {
    alert(`Friend request sent to ${user.name}`);
    setSearchResults((prev) => prev.filter((u) => u.id !== user.id)); // Remove from search results
  };

  const handleAcceptRequest = (user) => {
    setFriends((prev) => [...prev, user]);
    setIncomingRequests((prev) => prev.filter((req) => req.id !== user.id)); // Remove from requests
  };

  const renderContent = () => {
    switch (activeTab) {
      case "Friends":
        return (
          <div>
            <h2 className="text-xl font-semibold mb-3">Your Friends</h2>
            <ul className="space-y-3">
              {friends.map((friend) => (
                <li
                  key={friend.id}
                  className="flex items-center justify-between bg-gray-100 p-3 rounded-lg"
                >
                  <span>{friend.name}</span>
                  <button
                    onClick={() => alert(`Options for ${friend.name}`)}
                    className="text-gray-500 hover:text-gray-800"
                  >
                    &#8230;
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      case "Search":
        return (
          <div>
            <h2 className="text-xl font-semibold mb-3">Search Users</h2>
            <input
              type="text"
              placeholder="Search for users to add"
              value={searchQuery}
              onChange={handleSearch}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            {searchResults.length > 0 && (
              <ul className="space-y-3 mt-3">
                {searchResults.map((user) => (
                  <li
                    key={user.id}
                    className="flex items-center justify-between bg-gray-100 p-3 rounded-lg"
                  >
                    <span>{user.name}</span>
                    <button
                      onClick={() => handleSendRequest(user)}
                      className="bg-gray-500 text-white px-3 py-1 rounded-md hover:bg-gray-600"
                    >
                      Send Request
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      case "Requests":
        return (
          <div>
            <h2 className="text-xl font-semibold mb-3">Incoming Friend Requests</h2>
            {incomingRequests.length > 0 ? (
              <ul className="space-y-3">
                {incomingRequests.map((req) => (
                  <li
                    key={req.id}
                    className="flex items-center justify-between bg-gray-100 p-3 rounded-lg"
                  >
                    <span>{req.name}</span>
                    <button
                      onClick={() => handleAcceptRequest(req)}
                      className="bg-gray-500 text-white px-3 py-1 rounded-md hover:bg-gray-600"
                    >
                      Accept
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No incoming friend requests</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Header />
      <div className="flex h-screen flex-col lg:flex-row pt-12">
        {/* Sidebar for larger screens */}
        <div className="lg:w-1/4 bg-gray-200 p-4 lg:block hidden">
          <h1 className="text-2xl font-bold mb-6">Social</h1>
          <ul className="space-y-4">
            {["Friends", "Search", "Requests"].map((category) => (
              <li
                key={category}
                className={`cursor-pointer p-2 rounded-md ${
                  activeTab === category
                    ? "bg-gray-500 text-white transition-all"
                    : "hover:font-semibold"
                }`}
                onClick={() => setActiveTab(category)}
              >
                {category}
              </li>
            ))}
          </ul>
        </div>

        {/* Mobile Sidebar (Hamburger Menu) */}
        <div className="lg:hidden p-4">
          <button
            className="text-gray-700"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <svg
              className="w-6 h-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {isSidebarOpen && (
            <div className="absolute top-12 left-0 w-full bg-gray-200 shadow-lg flex flex-col space-y-2 p-4">
              {["Friends", "Search", "Requests"].map((category) => (
                <li
                  key={category}
                  className={`cursor-pointer p-2 rounded-md ${
                    activeTab === category
                      ? "bg-gray-500 text-white transition-all"
                      : "hover:font-semibold"
                  }`}
                  onClick={() => {
                    setIsSidebarOpen(false); // Close menu after selection
                    setActiveTab(category);
                  }}
                >
                  {category}
                </li>
              ))}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:w-3/4 w-full p-6">
          {loading ? (
            <p>Loading user data...</p>
          ) : (
            renderContent()
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Social;
