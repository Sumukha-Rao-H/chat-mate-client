import React from "react";
import { useRoutes } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Header from "./components/Navbar";
import Home from "./pages/HomePage";
import { AuthProvider } from "./context/authContext/index";

function App() {
  const routesArray = [
    { path: "*", element: <Login /> },
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> },
    { path: "/home", element: <Home /> },
  ];

  const routesElement = useRoutes(routesArray);

  return (
    <AuthProvider>
      <Header />
      <div className="w-full h-screen flex flex-col">{routesElement}</div>
    </AuthProvider>
  );
}

export default App;
