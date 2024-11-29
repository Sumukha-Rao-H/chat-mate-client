import React from 'react'
import { useAuth } from '../context/authContext/index'
import { doSignOut } from '../firebase/auth.js'

const Home = () => {
    const { currentUser } = useAuth();

    const handleLogout = async () => {
        try {
            await doSignOut();
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    if (!currentUser) {
        return <div>Loading...</div>;
    }
    
    return (
        <div className='flex justify-between items-center p-4 text-2xl font-bold pt-11'>
            <div>
                Hello {currentUser.displayName ? currentUser.displayName : currentUser.email}, you are now logged in.
            </div>
            <button
                onClick={handleLogout}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Logout
            </button>
        </div>

    )
}

export default Home