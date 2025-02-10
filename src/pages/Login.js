import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css"; // Import CSS file

const Login = ({ setIsAuthenticated }) => {
  const [credentials, setCredentials] = useState({ login_id: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "https://namami-infotech.com/M&M/src/auth/login_web.php",
        credentials,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const { success, message, user } = response.data;

      if (success) {
        localStorage.setItem("user", JSON.stringify(user));
        setIsAuthenticated(true);
        navigate("/out-delivery");
      } else {
        setError(message || "Invalid login credentials");
      }
    } catch (err) {
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <img
            className="login-logo"
            src="https://namami-infotech.com/M&M/icons/logo.png"
            alt="Company Logo"
          />
          <h2>VEHICLE MANAGEMENT SYSTEM</h2>
          <p className="login-subtitle">LOGIN YOUR ACCOUNT</p>
        </div>

        <div className="login-form">
          <div className="input-group">
            <input
              type="text"
              placeholder="Login ID"
              className="login-input"
              value={credentials.login_id}
              onChange={(e) => setCredentials({ ...credentials, login_id: e.target.value })}
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              className="login-input"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button className="login-button" onClick={handleLogin} disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>

          {/* <p className="forgot-password">Forgot your password?</p> */}
        </div>
      </div>
    </div>
  );
};

export default Login;
