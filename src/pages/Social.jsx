import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import Header from "../components/Navbar";
import Footer from "../components/Footer";
import NotificationPopup from "../components/ui/Notification";

const Social = () => {

  const auth = getAuth();
  const curUser = auth.currentUser;
  const [activeTab, setActiveTab] = useState("Friends");
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [friends, setFriends] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [popupMessage, setPopupMessage] = useState('');

  useEffect(() => {
    if (curUser) {
      fetchFriendRequests(curUser);
      fetchFriends(curUser);
    }
  }, [curUser]);


  const fetchFriends = async (user) => {
    try {
      setLoading(true); // Set loading to true while fetching
      const response = await fetch(`${process.env.SERVER_URL}/api/get-friends?uid=${encodeURIComponent(user.uid)}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch friends list");
      }

      const friendsList = await response.json();
      setFriends(friendsList); // Update the friends state
      setLoading(false); // Set loading to false when data is fetched
    } catch (error) {
      console.error("Error fetching friends:", error);
      setLoading(false); // Set loading to false in case of error
    }
  };

  const fetchFriendRequests = async (user) => {
    try {
      const response = await fetch(`${process.env.SERVER_URL}/api/get-requests?uid=${encodeURIComponent(user.uid)}`, {
        method: "GET",  // This is now a GET request
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch friend requests");
      }
  
      const requests = await response.json();
      setIncomingRequests(requests);  // Update state with the fetched requests
      setLoading(false);  // Set loading to false when the data is fetched
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      setLoading(false);  // Set loading to false in case of error
    }
  };
  

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear any existing timeout
    if (debounceTimeout) {
        clearTimeout(debounceTimeout);
    }

    const newTimeout = setTimeout(() => {
        performSearch(query); // Call the search function with the query
    }, 400); // Adjust the debounce delay as needed

    setDebounceTimeout(newTimeout);
  };


  const performSearch = async (query) => {
    if (!query.trim()) {
        setSearchResults([]); // Clear results if query is empty
        return;
    }

    try {
        // Send the query to the backend
        const response = await fetch(`${process.env.SERVER_URL}/api/user/search?query=${encodeURIComponent(query)}`);

        if (!response.ok) {
            throw new Error("Failed to fetch search results");
        }

        const results = await response.json(); // Parse the JSON response
        setSearchResults(results); // Update state with the search results
    } catch (error) {
        console.error("Error fetching search results:", error);
    }
  };



  const handleSendRequest = async (sender, receiver) => {
    try {
      const response = await fetch(`${process.env.SERVER_URL}/api/friend-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          senderUid: sender.uid,
          receiverUid: receiver.uid
        }), 
      });

      if (!response.ok) {
        throw new Error("Failed to send friend request");
      }
      setSearchResults((prev) => prev.filter((u) => u.id !== receiver.id)); // Remove from search results
      setPopupMessage({
        title: "Success!",
        body: "Friend request sent.",
      });
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const response = await fetch(`${process.env.SERVER_URL}/api/accept-friend-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to accept friend request");
      }
  
      const result = await response.json();
      console.log(result.message);
  
      // Update the state to remove the accepted request
      setIncomingRequests((prevRequests) =>
        prevRequests.filter((req) => req.id !== requestId)
      );
      setPopupMessage({
        title: "Success!",
        body: "Friend request acceepted.",
      });
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };
  const handleRejectRequest = async (requestId) => {
    try {
      const response = await fetch(`${process.env.SERVER_URL}/api/reject-friend-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to reject friend request");
      }
  
      const result = await response.json();
      console.log(result.message);
  
      // Update the state to remove the rejected request
      setIncomingRequests((prevRequests) =>
        prevRequests.filter((req) => req.id !== requestId)
      );
      setPopupMessage({
        title: "Success!",
        body: "Friend request rejected.",
      });
    } catch (error) {
      console.error("Error rejecting friend request:", error);
    }
  };

  const handleClosePopup = () => {
    setPopupMessage(null); // Close the popup by clearing the message
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
                  <span>{friend.displayName}</span>
                  <button
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
                      <ul
                          className="space-y-3 mt-3 transition-all animate-fade-in"
                      >
                          {searchResults.map((user) => (
                              <li
                                  key={user.displayName}
                                  className="flex items-center justify-between bg-gray-100 p-3 rounded-lg"
                              >
                                  <span>{user.displayName}</span>
                                  <button
                                      onClick={() => handleSendRequest(curUser, user)}
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
                        {/* Display the sender's displayName */}
                        <span>{req.sender.displayName}</span>
                        <div className="flex items-center space-x-3">

                        
                          <button
                            onClick={() => handleAcceptRequest(req.id)}
                            className="bg-gray-500 text-white px-3 py-1 rounded-md hover:bg-gray-600"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectRequest(req.id)}
                            className="bg-gray-500 text-white px-3 py-1 rounded-md hover:bg-gray-600"
                          >
                            Reject
                          </button>
                        </div>
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
                  <ul className="list-none p-0 m-0">
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
                  </ul>
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
      {popupMessage && (
        <NotificationPopup message={popupMessage} onClose={handleClosePopup} />
      )}
      <Footer />
    </>
  );
};

export default Social;
