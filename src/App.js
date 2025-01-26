import React from "react";
import { useLocation, useRoutes } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/HomePage";
import Social from "./pages/Social";
import Settings from "./pages/Settings";
import { AuthProvider } from "./context/authContext";
import { SocketProvider } from "./context/signallingServerContext";
import { getAuth } from "firebase/auth";



function App() {

  const auth = getAuth();
  const user = auth.currentUser;

  const routesArray = [
    { path: "*", element: <Login /> },
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> },
    { path: "/home", element: <Home /> },
    { path: "/social", element: <Social /> },
    { path: "/settings", element: <Settings /> },
  ];

  const routesElement = useRoutes(routesArray);

  return (
    <AuthProvider>
      <SocketProvider user={user}>
        <div className="w-full h-screen flex flex-col">{routesElement}</div>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
