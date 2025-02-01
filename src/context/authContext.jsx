import React, { useState, useEffect, useContext } from "react";
import { auth } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        // If user is logged in and currently on /login or /register, redirect to home.
        if (
          window.location.pathname === "/login" ||
          window.location.pathname === "/register"
        ) {
          navigate("/home", { replace: true });
        }
      } else {
        setCurrentUser(null);
        if (
          window.location.pathname !== "/login" &&
          window.location.pathname !== "/register"
        ) {
          navigate("/login", { replace: true });
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [navigate]);

  const value = {
    currentUser,
    isLoggedIn: !!currentUser,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
