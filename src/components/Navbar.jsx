import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const Header = () => {
  const [profileImage, setProfileImage] = useState("");
  const [newImage, setNewImage] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const auth = getAuth();
  const db = getFirestore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = auth.currentUser;
      if (user && user.uid) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setProfileImage(userData.profileImageUrl || ""); // Load existing profile image URL
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
    };
    fetchUserProfile();
  }, [auth, db]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImage(file);
      const reader = new FileReader();
      reader.onload = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleImageSave = async () => {
    if (!newImage) return;

    const user = auth.currentUser;
    if (!user) {
      setErrorMessage("You must be logged in to update the profile image.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("file", newImage);
      formData.append("upload_preset", "chat-app");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dtuunaa3q/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload image to Cloudinary.");
      }

      const data = await response.json();
      const cloudinaryUrl = data.secure_url;

      const userDocRef = doc(db, "users", user.uid);
      await setDoc(
        userDocRef,
        { profileImageUrl: cloudinaryUrl },
        { merge: true }
      );

      setProfileImage(cloudinaryUrl); // Update profile image in the navbar
      setNewImage(null);
      setPreviewImage("");
    } catch (error) {
      console.error("Error updating profile image:", error);
      setErrorMessage("Failed to update profile image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { name: "Dashboard", path: "/home" },
    { name: "Social", path: "/social" },
    { name: "Settings", path: "/settings" },
    { name: "Logout", path: null },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login", { replace: true }); // Explicitly redirect to login
    } catch (error) {
      console.error("Logout failed:", error);
  }
  };

  return (
    <nav className="flex flex-row justify-between px-4 w-full z-20 fixed top-0 left-0 h-12 border-b place-content-center items-center bg-gray-200">
      <div className="flex items-center text-sm text-black" onClick={() => navigate("/settings")}>
        {profileImage ? (
          <img
            src={profileImage}
            alt="Profile"
            className="w-8 h-8 rounded-full border border-gray-400 cursor-pointer"
          />
        ) : (
          <span className="w-8 h-8 rounded-full border border-gray-400 bg-gray-400"></span>
        )}
        <span className="text-lg text-black font-bold p-3">{auth.currentUser?.displayName || auth.currentUser?.email}</span>
      </div>

      <div className="flex space-x-3">
        {tabs.map((tab) => (
          <p
            key={tab.name}
            className={`text-base cursor-pointer ${
              location.pathname === tab.path ? "text-gray-700 font-bold" : "hover:text-gray-400"
            }`}
            onClick={() => {
              if (tab.name === "Logout") {
                handleLogout();
              } else {
                navigate(tab.path);
              }
            }}
          >
            {tab.name}
          </p>
        ))}
      </div>
    </nav>
  );
};

export default Header;
