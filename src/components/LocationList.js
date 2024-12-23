import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material'; // Importing eye icons

const LocationList = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false); // State to control dialog visibility
  const [newLocation, setNewLocation] = useState({ name: '', latlong: '', password: '', login_id: '' });
  const [visiblePasswords, setVisiblePasswords] = useState({}); // State to track visible passwords for each row

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('https://namami-infotech.com/M&M/src/location/get_location.php');
        const data = await response.json();

        if (data.success) {
          setLocations(data.data);
        } else {
          setError(data.message || 'Failed to fetch locations');
        }
      } catch (err) {
        setError('Error fetching locations');
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const handleAddLocationClick = () => {
    setOpenDialog(true); // Open the dialog
  };

  const handleCloseDialog = () => {
    setOpenDialog(false); // Close the dialog
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewLocation((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    const { name, latlong, password, login_id } = newLocation;
    if (!name || !latlong || !password || !login_id) {
      setError('Please fill all fields');
      return;
    }

    // Send the POST request to add the location
    try {
      const response = await fetch('https://namami-infotech.com/M&M/src/location/add_location.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newLocation),
      });
      const data = await response.json();

      if (data.success) {
        setLocations((prev) => [...prev, newLocation]); // Add the new location to the list
        handleCloseDialog(); // Close the dialog
      } else {
        setError(data.message || 'Failed to add location');
      }
    } catch (err) {
      setError('Error adding location');
    }
  };

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [id]: !prev[id], // Toggle visibility for the specific row
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Location List
        </Typography>
        <Button variant="contained" sx={{ backgroundColor: '#2C3E50' }} onClick={handleAddLocationClick}>
          Add Location
        </Button>
      </Box>

      {error && (
        <Typography variant="body1" color="error" gutterBottom>
          {error}
        </Typography>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#2C3E50' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Latitude/Longitude</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Login ID</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Password</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {locations.map((location) => (
              <TableRow key={location.id}>
                <TableCell>{location.id}</TableCell>
                <TableCell>{location.name}</TableCell>
                <TableCell>{location.latlong}</TableCell>
                <TableCell>{location.login_id}</TableCell>
                <TableCell>
                  {/* Password field with visibility toggle */}
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ mr: 1 }}>
                      {visiblePasswords[location.id] ? location.password : '••••••••'}
                    </Typography>
                    <IconButton onClick={() => togglePasswordVisibility(location.id)}>
                      {visiblePasswords[location.id] ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Location Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Add New Location</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            variant="outlined"
            fullWidth
            margin="normal"
            name="name"
            value={newLocation.name}
            onChange={handleChange}
          />
          <TextField
            label="Latitude/Longitude"
            variant="outlined"
            fullWidth
            margin="normal"
            name="latlong"
            value={newLocation.latlong}
            onChange={handleChange}
          />
          <TextField
            label="Login ID"
            variant="outlined"
            fullWidth
            margin="normal"
            name="login_id"
            value={newLocation.login_id}
            onChange={handleChange}
          />
          <TextField
            label="Password"
            variant="outlined"
            fullWidth
            margin="normal"
            name="password"
            type={visiblePasswords[newLocation.id] ? 'text' : 'password'} // Toggle password visibility in the form
            value={newLocation.password}
            onChange={handleChange}
            InputProps={{
              endAdornment: (
                <IconButton onClick={() => togglePasswordVisibility(newLocation.id)}>
                  {visiblePasswords[newLocation.id] ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary">
            Add Location
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LocationList;
