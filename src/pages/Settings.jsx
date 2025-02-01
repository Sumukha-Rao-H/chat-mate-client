import React, { useState, useEffect } from 'react';
import Header from "../components/Navbar";
import Footer from "../components/Footer";
import ProfileImage from '../components/ProfileImage';
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const Settings = () => {

  const auth = getAuth();
  const user = auth.currentUser;
  const db = getFirestore();

  const [activeCategory, setActiveCategory] = useState("Account");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [settings, setSettings] = useState({
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
    },
    privacy: {
      profileVisibility: "Public", // Options: Public, Friends Only, Private
      allowSearch: true,
    },
  });

  // State for handling profile image URL
  const [profileImage, setProfileImage] = useState(
    "https://via.placeholder.com/150" // Placeholder image URL
  );
  const [loading, setLoading] = useState(true); // Loading state for Firestore data

  // Fetch user data from Firestore when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return; // No user logged in

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Set profile image URL from Firestore
          setProfileImage(userData.profileImageUrl || "/public/uploads/default-user.png"); // Fallback to placeholder if no URL
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [auth, db]); // Runs once when the component mounts

  // Function to handle image change
  const handleChangeImage = (newImageUrl) => {
    setProfileImage(newImageUrl);
  };

  const toggleNotifications = () => {
    setNotificationsEnabled((prev) => !prev);
  };

  const renderSettingsContent = () => {
    switch (activeCategory) {
      case "Account":
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
            <div className="space-y-4">
              <div className='flex space-x-4'>
                <ProfileImage imageUrl={profileImage} onChangeImage={handleChangeImage} />
                <label className="block text-lg text-gray-700 font-bold self-center">{user.displayName}</label>
              </div>
              <div>
                <label className="block text-gray-700">Display Name</label>
                <input
                  type="text"
                  placeholder="Enter new username"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  onChange={(e) => setSettings({ ...settings, account: { ...settings.account, email: e.target.value } })}
                />
              </div>
            </div>
          </div>
        );
      case "Notifications":
        return (
          <div className="flex items-center">
            <span className="mr-3 text-gray-700 font-medium">
              {notificationsEnabled ? "Notifications On" : "Notifications Off"}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={toggleNotifications}
                className="sr-only peer"
              />
              <div
                className="w-11 h-6 bg-gray-200 rounded-full peer
                          dark:bg-gray-500
                          peer-checked:bg-black
                          after:content-['']
                          after:absolute after:top-[2px] after:left-[2px] 
                          after:bg-white after:border-gray-300 after:border 
                          after:rounded-full after:h-5 after:w-5 after:transition-all 
                          dark:border-gray-600 
                          peer-checked:after:translate-x-full 
                          peer-checked:after:border-white"
              ></div>
            </label>
          </div>
        );
      case "Privacy":
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Privacy Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700">Profile Image Visibility</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={settings.privacy.profileVisibility}
                  onChange={(e) => setSettings({ ...settings, privacy: { ...settings.privacy, profileVisibility: e.target.value } })}
                >
                  <option value="Public">Public</option>
                  <option value="Friends Only">Friends Only</option>
                  <option value="Private">Private</option>
                </select>
              </div>
            </div>
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
          <h1 className="text-2xl font-bold mb-6">Settings</h1>
          <ul className="space-y-4">
            {["Account", "Notifications", "Privacy"].map((category) => (
              <li
                key={category}
                className={`cursor-pointer p-2 rounded-md ${
                  activeCategory === category
                    ? "font-bold"
                    : "hover:font-semibold"
                }`}
                onClick={() => setActiveCategory(category)}
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
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
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

          {mobileMenuOpen && (
            <div className="absolute top-12 left-0 w-full bg-gray-200 shadow-lg flex flex-col space-y-2 p-4">
              {["Account", "Notifications", "Privacy"].map((category) => (
                <ul className="list-none p-0 m-0">
                  <li
                    key={category}
                    className={`cursor-pointer p-2 rounded-md ${
                      activeCategory === category
                      ? "font-bold"
                      : "hover:font-semibold"
                    }`}
                    onClick={() => {
                      setMobileMenuOpen(false); // Close menu after selection
                      setActiveCategory(category);
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
            renderSettingsContent()
          )}
          <button className="mt-6 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
            Save Changes
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Settings;
