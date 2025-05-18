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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  IconButton,
  Autocomplete,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import RestartAltIcon from '@mui/icons-material/RestartAlt';
const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [newEmployee, setNewEmployee] = useState({
    EmpId:"",
    Full_Name: "",
    email: "",
    phone_number: "",
    password: "",
    role: "",
    login_id: "",
    location_id: [], // Change to an array to store multiple location IDs
  });
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.Full_Name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const fetchLocations = async () => {
    try {
      const response = await fetch(
        "https://namami-infotech.com/M&M/src/location/get_location.php"
      );
      const data = await response.json();

      if (data.success) {
        setLocations(data.data);
      } else {
        setError(data.message || "Failed to fetch locations");
      }
    } catch (err) {
      setError("Error fetching locations");
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchLocations();
  }, []);

  const handleAddEmployeeClick = () => {
    setIsEditing(false);
    setOpenDialog(true);
    setNewEmployee({
      Employee_Id: "",
      EmpId: "",
      full_name: "",
      email: "",
      phone_number: "",
      password: "",
      role: "",
      login_id: "",
      location_id: [],
    });
  };

  const handleEditClick = (employee) => {
    setIsEditing(true);
    setOpenDialog(true);
    setSelectedEmployee(employee);
    setNewEmployee({
      EmpId: employee.EmpId,
      full_name: employee.Full_Name,
      email: employee.Email,
      phone_number: employee.Phone_Number,
      password: "",
      role: employee.Role,
      login_id: employee.Login_Id,
      location_id: employee.LocationId ? employee.LocationId.split(",") : [],
    });
  };
  const handleCloseDialog = () => {
  setOpenDialog(false);
  setError(""); // Clear error when dialog is closed
    setNewEmployee({ // Reset form fields
    EmpId:"",
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
    role: "",
    login_id: "",
    location_id: [],
  });
};

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewEmployee((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    const { Employee_Id, EmpId, full_name, email, phone_number, password, role, login_id, location_id } =
      newEmployee;

    if (!EmpId || !full_name || !email || !role || location_id.length === 0) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      const apiUrl = isEditing
        ? "https://namami-infotech.com/M&M/src/employee/edit_employee.php"
        : "https://namami-infotech.com/M&M/src/employee/add_employee.php";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(apiUrl, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newEmployee,
          location_id: location_id.join(","), 
        }),
      });

      const data = await response.json();

      if (data.success) {
        handleCloseDialog();
        fetchEmployees(); 
      } else {
        setError(data.message || "Failed to save employee.");
      }
    } catch (err) {
      setError("Error saving employee.");
    }
  };
  const handleRemoveMobileID = async (employeeId) => {
    try {
      const response = await fetch(
        "https://namami-infotech.com/M&M/src/employee/remove_device.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ employee_id: employeeId }),
        }
      );
      const data = await response.json();
      if (data.success) {
        alert("Mobile ID removed successfully.");
        fetchEmployees();
      } else {
        alert( "Mobile ID already removed");
      }
    } catch (err) {
      setError("Error removing Mobile ID.");
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
         <TextField
          label="Search Employee"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <Button
          variant="contained"
          sx={{ backgroundColor: "teal" }}
          onClick={handleAddEmployeeClick}
        >
          Add Employee
        </Button>
      </Box>



      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: "teal" }}>
            <TableRow>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>EMP ID</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>LogIn ID</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Name</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Email</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Phone</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Role</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Location</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Mobile ID</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
  {filteredEmployees.map((employee) => (
    <TableRow key={employee.Employee_Id}>
      <TableCell>{employee.EmpId}</TableCell>
      <TableCell>{employee.Login_Id}</TableCell>
      <TableCell>{employee.Full_Name}</TableCell>
      <TableCell>{employee.Email}</TableCell>
      <TableCell>{employee.Phone_Number}</TableCell>
      <TableCell>{employee.Role === 'Manager' ? 'Area Manager' : employee.Role}</TableCell>

      <TableCell>
         
        {employee.LocationId && employee.LocationId.split(",").length > 0
          ? locations
              .filter((loc) =>
                employee.LocationId
                  .split(",")
                  .includes(loc.id.toString())
              )
              .map((loc) => loc.abbrevation)
              .join(", ")
          : "N/A"}
      </TableCell>
      
      <TableCell>
        <IconButton color="primary" onClick={() => handleEditClick(employee)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    variant="contained"
                    sx={{backgroundColor:"red", color:"white", ":hover": {backgroundColor:"red"}}}
                    onClick={() => handleRemoveMobileID(employee.Employee_Id)}
                  >
                    <RestartAltIcon />
                  </IconButton>
                </TableCell>
    </TableRow>
  ))}
</TableBody>

        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
         <DialogTitle>{isEditing ? "Edit Employee" : "Add New Employee"}</DialogTitle>
        {error && (
        <Typography variant="body1" color="error" sx={{ml: 1}} gutterBottom>
          {error}
        </Typography>
      )}
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Full Name"
                variant="outlined"
                fullWidth
                margin="normal"
                name="full_name"
                value={newEmployee.full_name}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Employee Id"
                variant="outlined"
                fullWidth
                margin="normal"
                name="EmpId"
                value={newEmployee.EmpId}
                onChange={handleChange}
                disabled={isEditing}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Email"
                type="email"
                variant="outlined"
                fullWidth
                margin="normal"
                name="email"
                value={newEmployee.email}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Phone Number"
                variant="outlined"
                type="number"
                fullWidth
                margin="normal"
                name="phone_number"
                value={newEmployee.phone_number}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth margin="normal" required>
  <InputLabel>Role</InputLabel>
  <Select
    name="role"
    value={newEmployee.role}
    onChange={handleChange}
  >
    <MenuItem value="Manager">Area Manager</MenuItem>
    <MenuItem value="Supervisor">Supervisor</MenuItem>
  </Select>
</FormControl>
            </Grid>
            <Grid item xs={6}>
              <Autocomplete
            multiple
            options={locations}
            getOptionLabel={(option) => option.abbrevation}
            onChange={(event, value) =>
              setNewEmployee({ ...newEmployee, location_id: value.map((v) => v.id) })
            }
                renderInput={(params) => <TextField {...params} label="Location" margin="normal" />}
                fullWidth
          />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Login Id"
                variant="outlined"
                fullWidth
                margin="normal"
                name="login_id"
                value={newEmployee.login_id}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Password"
                variant="outlined"
                type="password"
                fullWidth
                margin="normal"
                name="password"
                value={newEmployee.password}
                onChange={handleChange}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            Cancel
          </Button>
           <Button onClick={handleSubmit} color="primary">{isEditing ? "Update" : "Add"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeList;
