import React, { useState, useEffect, useContext } from 'react';
import { auth } from '../../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';



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
                navigate("/home");  // Redirect to the dashboard after login
            } else {
                setCurrentUser(null);
                navigate("/login");  // Redirect to login if no user is found
            }
            setLoading(false);
        });
    
        return unsubscribe; // Clean up the listener when the component unmounts
    }, [navigate]);
    

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
