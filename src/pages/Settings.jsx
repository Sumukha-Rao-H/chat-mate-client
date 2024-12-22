import React, { useState, useEffect } from 'react';
import Header from "../components/Navbar";
import Footer from "../components/Footer";
import ProfileImage from '../components/ProfileImage';
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const Settings = () => {
  const [activeCategory, setActiveCategory] = useState("Account");
  const [settings, setSettings] = useState({
    account: {
      username: "johndoe123",
      email: "johndoe@example.com",
      password: "",
    },
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

  const auth = getAuth();
  const db = getFirestore();

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

  const renderSettingsContent = () => {
    switch (activeCategory) {
      case "Account":
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
            <div className="space-y-4">
              <div className='flex space-x-4'>
                <ProfileImage imageUrl={profileImage} onChangeImage={handleChangeImage} />
                <label className="block text-lg text-gray-700 font-bold self-center">sumukha riot</label>
              </div>
              <div>
                <label className="block text-gray-700">Email</label>
                <input
                  type="email"
                  placeholder="Enter email"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={settings.account.email}
                  onChange={(e) => setSettings({ ...settings, account: { ...settings.account, email: e.target.value } })}
                />
              </div>
              <div>
                <label className="block text-gray-700">Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={settings.account.password}
                  onChange={(e) => setSettings({ ...settings, account: { ...settings.account, password: e.target.value } })}
                />
              </div>
            </div>
          </div>
        );
      case "Notifications":
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
            <div className="space-y-4">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" checked={settings.notifications.emailNotifications} />
                <span>Email Notifications</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" checked={settings.notifications.smsNotifications} />
                <span>SMS Notifications</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" checked={settings.notifications.pushNotifications} />
                <span>Push Notifications</span>
              </label>
            </div>
          </div>
        );
      case "Privacy":
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Privacy Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700">Profile Visibility</label>
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
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" checked={settings.privacy.allowSearch} />
                <span>Allow people to find me in search</span>
              </label>
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
      <div className="flex h-screen grow pt-12">
        {/* Sidebar */}
        <div className="w-1/4 bg-gray-200 p-4">
          <h1 className="text-2xl font-bold mb-6">Settings</h1>
          <ul className="space-y-4">
            {["Account", "Notifications", "Privacy"].map((category) => (
              <li
                key={category}
                className={`cursor-pointer p-2 rounded-md ${activeCategory === category ? "bg-gray-500 text-white transition-all" : "hover:font-semibold"}`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </li>
            ))}
          </ul>
        </div>

        {/* Main Content */}
        <div className="w-3/4 p-6">
          {loading ? (
            <p>Loading user data...</p>
          ) : (
            renderSettingsContent()
          )}
          <button className="mt-6 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
            Save Changes
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Settings;
