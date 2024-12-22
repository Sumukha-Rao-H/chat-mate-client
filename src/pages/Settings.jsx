import React, { useState } from 'react';
import Header from "../components/Navbar";
import Footer from "../components/Footer";
import ProfileImage from '../components/ProfileImage';


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
    const handleInputChange = (section, key, value) => {
    setSettings((prev) => ({
        ...prev,
        [section]: {
        ...prev[section],
        [key]: value,
        },
        }));
    };
    
    const handleSave = () => {
        alert("Settings saved successfully!");
    };

    const [profileImage, setProfileImage] = useState(
        'https://via.placeholder.com/150'
    );
    
    const handleChangeImage = () => {
        // Logic to change the image (e.g., open a file picker, upload to Cloudinary)
        const newImageUrl = prompt('Enter new image URL:', profileImage);
        if (newImageUrl) {
          setProfileImage(newImageUrl);
        }
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
                    />
                </div>
                <div>
                    <label className="block text-gray-700">Password</label>
                    <input
                    type="password"
                    placeholder="Enter new password"
                    className="w-full p-2 border border-gray-300 rounded-md"
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
                    <input type="checkbox" className="mr-2" />
                    <span>Email Notifications</span>
                </label>
                <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span>SMS Notifications</span>
                </label>
                <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
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
                    <select className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="Public">Public</option>
                    <option value="Friends Only">Friends Only</option>
                    <option value="Private">Private</option>
                    </select>
                </div>
                <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
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
                        className={`cursor-pointer p-2 rounded-md ${
                            activeCategory === category
                            ? "bg-gray-500 text-white transition-all"
                            : "hover:font-semibold"
                        }`}
                        onClick={() => setActiveCategory(category)}
                        >
                        {category}
                        </li>
                    ))}
                    </ul>
                </div>

                {/* Main Content */}
                <div className="w-3/4 p-6">
                    {renderSettingsContent()}
                    <button className="mt-6 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                    Save Changes
                    </button>
                </div>
            </div>
            <Footer />
        </>
    );
}

export default Settings;