import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Box, TextField, Button, Typography, Container } from "@mui/material";

const Login = ({ setIsAuthenticated }) => {
  const [credentials, setCredentials] = useState({ EmpId: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        "https://namami-infotech.com/M&M/src/auth/login.php",
        credentials,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const { success, message, data } = response.data;

      if (success) {
        // Save user data to localStorage
        localStorage.setItem("user", JSON.stringify(data));

        // Update authentication state
        setIsAuthenticated(true);

        // Redirect to dashboard
        navigate("/");
      } else {
        setError(message);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
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
          label="Employee ID"
          variant="outlined"
          fullWidth
          sx={{ mb: 2 }}
          value={credentials.EmpId}
          onChange={(e) =>
            setCredentials({ ...credentials, EmpId: e.target.value })
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
