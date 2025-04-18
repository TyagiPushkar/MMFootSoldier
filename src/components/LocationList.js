import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Button, Dialog,
  DialogActions, DialogContent, DialogTitle, TextField, Autocomplete, IconButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

const roleOptions = ['DA (Packet)', 'DA (Salary)', 'SSA', 'TL', 'Supervisor', 'Manager'];

const LocationList = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [newLocation, setNewLocation] = useState({
    abbrevation: '',
    address: '',
    latlong: '',
    roles: []
  });

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

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleAddLocationClick = () => {
    setIsEditing(false);
    setNewLocation({ abbrevation: '', address: '', latlong: '', roles: [] });
    setOpenDialog(true);
  };

  const handleEditClick = (location) => {
    setIsEditing(true);
    setSelectedLocation(location);
    setNewLocation({
      abbrevation: location.abbrevation,
      address: location.address,
      latlong: location.latlong,
      roles: location.roles ? location.roles.split(',') : []
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError('');
    setSelectedLocation(null);
    setNewLocation({ abbrevation: '', address: '', latlong: '', roles: [] });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewLocation((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const { abbrevation, address, latlong, roles } = newLocation;
    if (!abbrevation || !address || !latlong || roles.length === 0) {
      setError('Please fill all fields');
      return;
    }

    const payload = {
      ...newLocation,
      roles: roles.join(','),
    };

    const url = isEditing
      ? 'https://namami-infotech.com/M&M/src/location/edit_location.php'
      : 'https://namami-infotech.com/M&M/src/location/add_location.php';

    if (isEditing && selectedLocation) {
      payload.id = selectedLocation.id;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        fetchLocations();
        handleCloseDialog();
      } else {
        setError(data.message || 'Failed to submit location');
      }
    } catch (err) {
      setError('Error submitting location');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Location List
        </Typography>
        <Button variant="contained" sx={{ backgroundColor: 'teal' }} onClick={handleAddLocationClick}>
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
          <TableHead sx={{ backgroundColor: 'teal' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Abbrevation</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Address</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Latitude/Longitude</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Roles</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {locations.map((location) => (
              <TableRow key={location.id}>
                <TableCell>{location.id}</TableCell>
                <TableCell>{location.abbrevation}</TableCell>
                <TableCell>{location.address}</TableCell>
                <TableCell>{location.latlong}</TableCell>
                <TableCell>{location.roles}</TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => handleEditClick(location)}>
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog for Add/Edit */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{isEditing ? 'Edit Location' : 'Add New Location'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Abbrevation"
            variant="outlined"
            fullWidth
            margin="normal"
            name="abbrevation"
            value={newLocation.abbrevation}
            onChange={handleChange}
          />
          <TextField
            label="Address"
            variant="outlined"
            fullWidth
            margin="normal"
            name="address"
            value={newLocation.address}
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

          <Autocomplete
            multiple
            options={roleOptions}
            value={newLocation.roles}
            onChange={(event, newValue) =>
              setNewLocation((prev) => ({ ...prev, roles: newValue }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Roles"
                variant="outlined"
                margin="normal"
                fullWidth
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary">
            {isEditing ? 'Update Location' : 'Add Location'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LocationList;
