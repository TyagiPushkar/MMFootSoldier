// src/App.js

import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import LoginPage from "./pages/Login";
import NotFound from "./components/NotFound";
import LocationList from "./components/LocationList";
import EmployeeList from "./components/EmployeeList";
import DeliveryList from "./components/Delivery";
import AmazonIdList from "./components/AmazonIdList";
import Return from "./components/Return";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("user") // Check if user data exists in localStorage
  );

  // Auto Logout After 10 Seconds
  useEffect(() => {
    const logoutTimer = setTimeout(() => {
  localStorage.removeItem("user");
  setIsAuthenticated(false);
  window.location.href = "/login";
}, 30 * 60 * 1000); 

    return () => clearTimeout(logoutTimer);
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />

        {/* Private Routes with Layout */}
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <Layout>
                <Routes>
                  <Route path="/office-locations" element={<LocationList />} />
                  <Route path="/employee-list" element={<EmployeeList />} />
                  <Route path="/out-delivery" element={<DeliveryList />} />
                  <Route path="/amazonId" element={<AmazonIdList />} />
                  <Route path="/return" element={<Return />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
