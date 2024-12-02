import React from "react";
import { useLocation, useRoutes } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/HomePage";
import Social from "./pages/Social";
import Settings from "./pages/Settings";
import { AuthProvider } from "./context/authContext/index";



function App() {
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
      <div className="w-full h-screen flex flex-col">{routesElement}</div>
    </AuthProvider>
  );
}

export default App;
