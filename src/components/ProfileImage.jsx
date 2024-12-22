import React, { useState } from "react";
import Popup from "./PopUpWindow.jsx";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const ProfileImage = ({ imageUrl, onChangeImage }) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [newImage, setNewImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const auth = getAuth();
  const db = getFirestore();

  const togglePopup = () => setIsPopupOpen(!isPopupOpen);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setNewImage(reader.result); // Set preview of the uploaded image
      };
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
      // Update the image URL in Firestore
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(
        userDocRef,
        { profileImageUrl: newImage },
        { merge: true } // Update only the profileImageUrl field
      );

      // Trigger parent logic to update the displayed image
      onChangeImage(newImage);
      setNewImage("");
      togglePopup();
    } catch (error) {
      console.error("Error updating profile image:", error);
      setErrorMessage("Failed to update profile image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Profile Image */}
      <img
        src={imageUrl}
        alt="Profile"
        className="w-32 h-32 rounded-full object-cover cursor-pointer"
        onClick={togglePopup}
      />

      {/* Popup */}
      <Popup isOpen={isPopupOpen} onClose={togglePopup}>
        <div className="flex flex-col items-center">
          {/* Maximized Image */}
          <img
            src={newImage || imageUrl}
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

          {/* Save Image Button */}
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
