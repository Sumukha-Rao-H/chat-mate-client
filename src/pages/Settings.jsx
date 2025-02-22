import React, { useState, useEffect } from 'react';
import Header from "../components/Navbar";
import Footer from "../components/Footer";
import NotificationPopup from "../components/ui/Notification";
import ProfileImage from '../components/ProfileImage';
import { getAuth } from "firebase/auth";

const Settings = () => {
  const auth = getAuth();
  const curUser = auth.currentUser;

  // Local state for settings; structure reflects API fields
  const [settings, setSettings] = useState({
    account: { displayName: "", profileImageUrl: "" },
    notifications: { notificationsEnabled: true },
    privacy: { profileVisibility: "Public" },
  });
  const [activeCategory, setActiveCategory] = useState("Account");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [popupMessage, setPopupMessage] = useState("");

  // Fetch user settings from the API when the component mounts
  useEffect(() => {
    if (curUser) {
      fetchSettings(curUser.uid);
    }
  }, [curUser]);

  const fetchSettings = async (uid) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_SERVER_URL}/api/get-settings?uid=${encodeURIComponent(uid)}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }
      const data = await response.json();
      // Map API response to local state format
      setSettings({
        account: {
          displayName: data.displayName || "",
          profileImageUrl: data.profileImageUrl || "../../public/uploads/default-user.png",
        },
        notifications: {
          notificationsEnabled: data.notificationsEnabled,
        },
        privacy: {
          profileVisibility: data.profileVisibility || "Public",
        },
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching settings:", error);
      setLoading(false);
    }
  };

  // Update settings via API PUT call
  const handleSaveChanges = async () => {
    try {
      const payload = {
        uid: curUser.uid,
        displayName: settings.account.displayName,
        profileImageUrl: settings.account.profileImageUrl,
        notificationsEnabled: settings.notifications.notificationsEnabled,
        profileVisibility: settings.privacy.profileVisibility,
      };

      const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/update-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to update settings");
      }

      const updatedSettings = await response.json();
      setSettings({
        account: {
          displayName: updatedSettings.displayName,
          profileImageUrl: updatedSettings.profileImageUrl,
        },
        notifications: {
          notificationsEnabled: updatedSettings.notificationsEnabled,
        },
        privacy: {
          profileVisibility: updatedSettings.profileVisibility,
        },
      });
      setPopupMessage({
        title: "Success!",
        body: "Settings updated successfully.",
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      setPopupMessage({
        title: "Error!",
        body: "Failed to update settings.",
      });
    }
  };

  // Handlers for account updates
  const handleChangeImage = (newUrl) => {
    setSettings(prev => ({
      ...prev,
      account: { ...prev.account, profileImageUrl: newUrl }
    }));
    setPopupMessage({
      title: "Success!",
      body: "Profile image updated successfully.",
    });
  };

  const handleDisplayNameChange = (e) => {
    const value = e.target.value;
    setSettings(prev => ({
      ...prev,
      account: { ...prev.account, displayName: value }
    }));
  };

  // Toggle notifications on/off
  const toggleNotifications = () => {
    setSettings(prev => ({
      ...prev,
      notifications: { notificationsEnabled: !prev.notifications.notificationsEnabled }
    }));
  };

  // Handle privacy dropdown change
  const handlePrivacyChange = (e) => {
    const value = e.target.value;
    setSettings(prev => ({
      ...prev,
      privacy: { ...prev.privacy, profileVisibility: value }
    }));
  };

  // Render the settings content based on the active category
  const renderSettingsContent = () => {
    switch (activeCategory) {
      case "Account":
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
            <div className="space-y-4">
              <div className="flex space-x-4">
                <ProfileImage imageUrl={settings.account.profileImageUrl} onChangeImage={handleChangeImage} />
                <label className="block text-lg text-gray-700 font-bold self-center">
                  {curUser.displayName}
                </label>
              </div>
              <div>
                <label className="block text-gray-700">Display Name</label>
                <input
                  type="text"
                  placeholder="Enter new username"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={settings.account.displayName}
                  onChange={handleDisplayNameChange}
                />
              </div>
            </div>
          </div>
        );
      case "Notifications":
        return (
          <div className="flex items-center">
            <span className="mr-3 text-gray-700 font-medium">
              {settings.notifications.notificationsEnabled ? "Notifications On" : "Notifications Off"}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.notificationsEnabled}
                onChange={toggleNotifications}
                className="sr-only peer"
              />
              <div
                className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-500 
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
                  onChange={handlePrivacyChange}
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
      <div className="flex h-screen flex-col lg:flex-row pt-12">
        {/* Sidebar for larger screens */}
        <div className="lg:w-1/4 bg-gray-200 p-4 lg:block hidden">
          <h1 className="text-2xl font-bold mb-6">Settings</h1>
          <ul className="space-y-4">
            {["Account", "Notifications", "Privacy"].map((category) => (
              <li
                key={category}
                className={`cursor-pointer p-2 rounded-md ${
                  activeCategory === category ? "font-bold" : "hover:font-semibold"
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {mobileMenuOpen && (
            <div className="absolute top-12 left-0 w-full bg-gray-200 shadow-lg flex flex-col space-y-2 p-4">
              {["Account", "Notifications", "Privacy"].map((category) => (
                <ul key={category} className="list-none p-0 m-0">
                  <li
                    className={`cursor-pointer p-2 rounded-md ${
                      activeCategory === category ? "bg-gray-500 text-white transition-all" : "hover:font-semibold"
                    }`}
                    onClick={() => {
                      setMobileMenuOpen(false);
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
            <div className="flex justify-center items-center h-full">
              <p className="text-gray-500">Loading settings...</p>
            </div>
          ) : (
            renderSettingsContent()
          )}
          <button
            onClick={handleSaveChanges}
            className="mt-6 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
          >
            Save Changes
          </button>
        </div>
      </div>
      {popupMessage && (
        <NotificationPopup message={popupMessage} onClose={() => setPopupMessage("")} />
      )}
    </>
  );
};

export default Settings;
