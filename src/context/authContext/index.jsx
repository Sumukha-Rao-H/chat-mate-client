import React, { useState, useEffect, useContext } from 'react';
import { auth } from '../../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = React.createContext();

export function useAuth(){
    return useContext(AuthContext)
}

export function AuthProvider( { children} ) {
    const [ currrentUSer , setCurrentUser ] = useState(null);
    const [ userLoggedin , setUserLoggedin ] = useState(null);
    const [ loading, setLoading ] = useState(true);

    useEffect(() =>{
        const unsubscribe = onAuthStateChanged(auth, initializeUser);
        return unsubscribe
    }, [])

    async function initializeUser(user) {
        if(user){
            setCurrentUser({ ...user });
            setUserLoggedin(true);
        } else {
            setCurrentUser(null);
            setUserLoggedin(false);
        }
        setLoading(false)
    }

    const value = {
        currrentUSer,
        userLoggedin,
        loading
    }

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}