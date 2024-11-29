import React, { useState, useEffect, useContext } from 'react';
import { auth } from '../../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthContext = React.createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
                if (location.pathname === "/login" || location.pathname === "/register") {
                    navigate("/home"); // Redirect only from login/register
                }
            } else {
                setCurrentUser(null);
                if (!["/login", "/register"].includes(location.pathname)) {
                    navigate("/login"); // Redirect to login unless on a public route
                }
            }
            setLoading(false);
        });

        return unsubscribe; // Clean up the listener when the component unmounts
    }, [navigate, location.pathname]);

    const value = {
        currentUser,
        isLoggedIn: currentUser !== null, // Dynamic calculation
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children} {/* Prevent rendering children until loading is complete */}
        </AuthContext.Provider>
    );
}
 