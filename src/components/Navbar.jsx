import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";

const Header = () => {
  const [profileImage, setProfileImage] = useState("../../public/uploads/default-user.png");
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const auth = getAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchProfileImage = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.REACT_APP_SERVER_URL}/api/get-settings?uid=${encodeURIComponent(user.uid)}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch profile image");
        }
        const data = await response.json();
        setProfileImage(data.profileImageUrl || "../../public/uploads/default-user.png");
      } catch (error) {
        console.error("Error fetching profile image:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileImage();
  }, [auth]);

  const tabs = [
    { name: "Dashboard", path: "/home" },
    { name: "Social", path: "/social" },
    { name: "Settings", path: "/settings" },
    { name: "Logout", path: null },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="flex flex-row justify-between px-4 w-full z-20 fixed top-0 left-0 h-12 border-b items-center bg-gray-200">
      <div
        className="flex items-center text-sm text-black"
        onClick={() => navigate("/settings")}
      >
        <img
          src={profileImage}
          alt="Profile"
          className="w-8 h-8 rounded-full border border-gray-400 cursor-pointer"
        />
        <span className="hidden sm:block text-lg text-black font-bold p-3">
          {auth.currentUser?.displayName || auth.currentUser?.email}
        </span>
      </div>

      <div className="sm:hidden">
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
      </div>

      <div className="hidden sm:flex space-x-3">
        {tabs.map((tab) => (
          <p
            key={tab.name}
            className={`text-base cursor-pointer ${
              location.pathname === tab.path
                ? "text-gray-700 font-bold"
                : "hover:text-gray-400"
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

      {mobileMenuOpen && (
        <div className="absolute top-12 left-0 w-full bg-gray-200 shadow-lg flex flex-col space-y-2 p-4 sm:hidden">
          {tabs.map((tab) => (
            <p
              key={tab.name}
              className={`text-base cursor-pointer ${
                location.pathname === tab.path
                  ? "text-gray-700 font-bold"
                  : "hover:text-gray-400"
              }`}
              onClick={() => {
                setMobileMenuOpen(false);
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
      )}
    </nav>
  );
};

export default Header;
