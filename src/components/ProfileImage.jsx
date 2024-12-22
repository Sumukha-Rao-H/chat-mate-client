import React, { useState } from "react";
import Popup from "./PopUpWindow.jsx";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const ProfileImage = ({ imageUrl, onChangeImage }) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [newImage, setNewImage] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const auth = getAuth();
  const db = getFirestore();

  const togglePopup = () => setIsPopupOpen(!isPopupOpen);

  // Handle image file selection
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImage(file);
      const reader = new FileReader();
      reader.onload = () => setPreviewImage(reader.result); // Preview the image
      reader.readAsDataURL(file);
    }
  };

  // Handle the image save process
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
      // Upload image to Cloudinary
      const formData = new FormData();
      formData.append("file", newImage);
      formData.append("upload_preset", "chat-app"); // Replace with your Cloudinary upload preset

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dtuunaa3q/image/upload`, // Replace with your Cloudinary cloud name
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload image to Cloudinary.");
      }

      const data = await response.json();
      const cloudinaryUrl = data.secure_url; // Get the uploaded image URL

      // Update the Firestore database with the image URL
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(
        userDocRef,
        { profileImageUrl: cloudinaryUrl }, // Store the URL
        { merge: true } // Merge with existing document data
      );

      // Update the UI
      onChangeImage(cloudinaryUrl);
      setNewImage(null); // Reset new image state
      setPreviewImage(""); // Clear preview image
      togglePopup(); // Close the popup
    } catch (error) {
      console.error("Error updating profile image:", error);
      setErrorMessage("Failed to update profile image. Please try again.");
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Profile Image Display */}
      <img
        src={imageUrl}
        alt="Profile"
        className="w-32 h-32 rounded-full object-cover cursor-pointer"
        onClick={togglePopup}
      />

      {/* Popup for Image Preview and Upload */}
      <Popup isOpen={isPopupOpen} onClose={togglePopup}>
        <div className="flex flex-col items-center">
          {/* Maximized Preview Image */}
          <img
            src={previewImage || imageUrl}
            alt="Profile Enlarged"
            className="w-full max-w-md rounded-lg mb-4 object-cover"
          />

          {/* Upload Image Input */}
          <label
            htmlFor="imageUpload"
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-300 mb-4"
          >
            Upload Image
          </label>
          <input
            id="imageUpload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />

          {/* Save Button */}
          <button
            onClick={handleImageSave}
            disabled={!newImage || loading}
            className={`px-4 py-2 rounded-lg ${
              newImage && !loading
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "bg-gray-400 text-gray-700 cursor-not-allowed"
            }`}
          >
            {loading ? "Saving..." : "Save"}
          </button>

          {/* Error Message */}
          {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}
        </div>
      </Popup>
    </div>
  );
};

export default ProfileImage;
