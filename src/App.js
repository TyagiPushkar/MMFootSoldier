// src/App.js

import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import LoginPage from "./pages/Login";
import NotFound from "./components/NotFound";
import Dashboard from "./components/Dashboard"; // Import the Dashboard component
import LocationList from "./components/LocationList";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("user") // Check if user data exists in localStorage
  );

  // Private Route Component
  const PrivateRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={<LoginPage setIsAuthenticated={setIsAuthenticated} />}
        />

        {/* Private Routes with Layout */}
        <Route
          path="/*" // Use "/*" to allow nested routing inside the layout
          element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} /> {/* Add the Dashboard route */}
                  {/* You can add more nested routes here */}
                  <Route path="/office-locations" element={<LocationList />} />
                </Routes>
              </Layout>
            </PrivateRoute>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
