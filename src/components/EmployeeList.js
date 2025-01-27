import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
    role: "",
    login_id: "",
    location_id: "",
  });

  const fetchEmployees = async () => {
    try {
      const response = await fetch(
        "https://namami-infotech.com/M&M/src/employee/get_employee.php"
      );
      const data = await response.json();

      if (data.success) {
        setEmployees(data.data);
      } else {
        setError(data.message || "Failed to fetch employees");
      }
    } catch (err) {
      setError("Error fetching employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployeeClick = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError(""); // Clear error when dialog is closed
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewEmployee((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    const { full_name, email, phone_number, password, role, login_id, location_id } = newEmployee;

    if (!full_name || !email || !password || !role) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      const response = await fetch(
        "https://namami-infotech.com/M&M/src/employee/add_employee.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newEmployee),
        }
      );

      const data = await response.json();

      if (data.success) {
        handleCloseDialog();
        fetchEmployees(); // Refresh the employee list
      } else {
        setError(data.message || "Failed to add employee.");
      }
    } catch (err) {
      setError("Error adding employee.");
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h4">Employee List</Typography>
        <Button
          variant="contained"
          sx={{ backgroundColor: "#2C3E50" }}
          onClick={handleAddEmployeeClick}
        >
          Add Employee
        </Button>
      </Box>

      {error && (
        <Typography variant="body1" color="error" gutterBottom>
          {error}
        </Typography>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: "#2C3E50" }}>
            <TableRow>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>ID</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Name</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Email</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Phone</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Role</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Mobile ID</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Location ID</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.Employee_Id}>
                <TableCell>{employee.Employee_Id}</TableCell>
                <TableCell>{employee.Full_Name}</TableCell>
                <TableCell>{employee.Email}</TableCell>
                <TableCell>{employee.Phone_Number}</TableCell>
                <TableCell>{employee.Role}</TableCell>
                <TableCell>{employee.MobileID}</TableCell>
                <TableCell>{employee.LocationId}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Add New Employee</DialogTitle>
        <DialogContent>
          <TextField
            label="Full Name"
            variant="outlined"
            fullWidth
            margin="normal"
            name="full_name"
            value={newEmployee.full_name}
            onChange={handleChange}
          />
          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            margin="normal"
            name="email"
            value={newEmployee.email}
            onChange={handleChange}
          />
          <TextField
            label="Phone Number"
            variant="outlined"
            fullWidth
            margin="normal"
            name="phone_number"
            value={newEmployee.phone_number}
            onChange={handleChange}
                  />
                  <TextField
            label="Login Id"
            variant="outlined"
            type="text"
            fullWidth
            margin="normal"
            name="login_id, "
            value={newEmployee.login_id}
            onChange={handleChange}
          />
          <TextField
            label="Password"
            variant="outlined"
            type="password"
            fullWidth
            margin="normal"
            name="password"
            value={newEmployee.password}
            onChange={handleChange}
          />
          <TextField
            label="Role"
            variant="outlined"
            fullWidth
            margin="normal"
            name="role"
            value={newEmployee.role}
            onChange={handleChange}
          />
          <TextField
            label="Location ID"
            variant="outlined"
            fullWidth
            margin="normal"
            name="location_id"
            value={newEmployee.location_id}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary">
            Add Employee
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeList;
