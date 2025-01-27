import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Box, TextField, Button, Typography, Container } from "@mui/material";

const Login = ({ setIsAuthenticated }) => {
  const [credentials, setCredentials] = useState({ login_id: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        "https://namami-infotech.com/M&M/src/auth/login_web.php", // Your login API endpoint
        credentials,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const { success, message, user } = response.data;

      if (success) {
        // Save user data to localStorage
        localStorage.setItem("user", JSON.stringify(user));

        // Update authentication state
        setIsAuthenticated(true);

        // Redirect to dashboard or any other page
        navigate("/");
      } else {
        // Show error message if login fails
        setError(message || "Invalid login credentials");
      }
    } catch (err) {
      // Handle API or network errors
      setError("Something went wrong. Please try again later.");
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <Typography variant="h4" sx={{ mb: 3 }}>
          Login
        </Typography>
        <TextField
          label="Login ID"
          variant="outlined"
          fullWidth
          sx={{ mb: 2 }}
          value={credentials.login_id}
          onChange={(e) =>
            setCredentials({ ...credentials, login_id: e.target.value })
          }
        />
        <TextField
          label="Password"
          type="password"
          variant="outlined"
          fullWidth
          sx={{ mb: 2 }}
          value={credentials.password}
          onChange={(e) =>
            setCredentials({ ...credentials, password: e.target.value })
          }
        />
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        <Button variant="contained" fullWidth onClick={handleLogin}>
          Login
        </Button>
      </Box>
    </Container>
  );
};

export default Login;
