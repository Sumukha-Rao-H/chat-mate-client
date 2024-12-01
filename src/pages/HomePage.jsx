import React from 'react'
import { useAuth } from '../context/authContext/index'
import Header from "../components/Navbar";
import Footer from "../components/Footer";
import Logo from "../components/ui/Logo";

const Home = () => {
    const { currentUser } = useAuth();

    if (!currentUser) {
        return <div>Loading...</div>;
    }
    
    return (
        <>
            <Header />
            <div className="flex flex-col min-h-screen">
                <div className="flex-grow">
                    <div className='flex justify-between items-center p-4 text-2xl font-bold pt-11'>
                        <div>
                            Hello {currentUser.displayName ? currentUser.displayName : currentUser.email}, you are now logged in.
                        </div>
                    </div>
                    <Logo />
                </div>

            <Footer />
            </div>
        </>

    )
}

export default Home