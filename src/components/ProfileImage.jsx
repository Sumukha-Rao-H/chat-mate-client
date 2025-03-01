import React, { useState } from "react";
import Popup from "./PopUpWindow.jsx";
import { getAuth } from "firebase/auth";

const ProfileImage = ({ imageUrl, onChangeImage }) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [newImage, setNewImage] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const auth = getAuth();

  const togglePopup = () => setIsPopupOpen(!isPopupOpen);

  // Handle image file selection
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if file is less than 1 MB
      if (file.size > 1024 * 1024) {
        setErrorMessage("File size must be less than 1 MB.");
        return;
      }
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
      formData.append("upload_preset", process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET); // Ensure this is set in your env

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/upload`;

      const response = await fetch(cloudinaryUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image to Cloudinary.");
      }

      const data = await response.json();
      const uploadedUrl = data.secure_url; // Get the uploaded image URL

      if (!uploadedUrl) {
        throw new Error("Cloudinary did not return a secure URL.");
      }

      // Instead of updating Firestore, update user settings via your API
      const payload = {
        uid: user.uid,
        // Optionally include other settings if needed; here we only update the profile image URL.
        displayName: "", // You can leave empty or retrieve the current display name if needed
        profileImageUrl: uploadedUrl,
        notificationsEnabled: true, // Default or current value
        profileVisibility: "Public", // Default or current value
      };

      const apiResponse = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/update-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!apiResponse.ok) {
        throw new Error("Failed to update settings");
      }

      const updatedSettings = await apiResponse.json();

      // Update the UI with the new profile image URL
      onChangeImage(updatedSettings.profileImageUrl);
      setNewImage(null);
      setPreviewImage("");
      togglePopup(); // Close the popup
    } catch (error) {
      console.error("Error updating profile image:", error);
      setErrorMessage("Failed to update profile image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Profile Image Display */}
      <img
        src={imageUrl}
        alt="Profile"
        className="w-32 h-32 rounded-full object-cover cursor-pointer transition-all duration-300 hover:ring-2 ring-gray-500"
        onClick={togglePopup}
      />

      {/* Popup for Image Preview and Upload */}
      <Popup isOpen={isPopupOpen} onClose={togglePopup}>
        <div className="flex flex-col items-center px-2">
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
