import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  IconButton,
  Dialog,
  DialogContent,
  Chip,
  TextField,
  Button
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';
const DeliveryList = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [locations, setLocations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
 const [filterDate, setFilterDate] = useState('');
  const role = JSON.parse(localStorage.getItem('user'))?.role || 'user';
  const locationId = JSON.parse(localStorage.getItem('user'))?.location_id || '';
useEffect(() => {
    fetchData();
  }, []);
  const fetchData = async () => {
    try {
      const locationRes = await fetch('https://namami-infotech.com/M&M/src/location/get_location.php');
      const locationData = await locationRes.json();
      if (locationData.success) {
        const locationMap = {};
        locationData.data.forEach(loc => {
          locationMap[loc.id] = loc.abbrevation;
        });
        setLocations(locationMap);
      }

      const deliveryRes = await fetch('https://namami-infotech.com/M&M/src/delivery/delivery_get.php?role=admin');
      const deliveryData = await deliveryRes.json();
      if (deliveryData.status === 'success') {
        setDeliveries(deliveryData.data);
        setFilteredDeliveries(deliveryData.data);
      } else {
        setError(deliveryData.message || 'Failed to fetch deliveries');
      }
    } catch (err) {
      setError('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setOpenDialog(true);
  };

   const handleFilterChange = (event) => {
    setFilterDate(event.target.value);
    if (event.target.value) {
      setFilteredDeliveries(
        deliveries.filter(d => d.Datetime.startsWith(event.target.value))
      );
    } else {
      setFilteredDeliveries(deliveries);
    }
  };

  const exportToCSV = () => {
    let csvContent = 'Emp Name,Type of Delivery,Number of Vehicles,Vehicle Numbers,Location,Datetime\n';
    filteredDeliveries.forEach(d => {
      csvContent += `${d.EmpName},${d.TypeOfDelivery},${d.NumberOfVehicle},${[d.VehicleNo1, d.VehicleNo2, d.VehicleNo3, d.VehicleNo4, d.VehicleNo5].filter(Boolean).join(' ')},${locations[d.LocationId] || 'Unknown'},${d.Datetime}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'deliveries.csv');
  };
  if (loading) {
    return <Typography variant="h6" align="center">Loading...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
       <Box display="flex" sx={{justifyContent:"space-between"}} mb={3}>
      <Typography variant="h4" gutterBottom align="center">Delivery List</Typography>
      {error && <Typography color="error" align="center">{error}</Typography>}
      
        <TextField
          type="date"
          label="Filter by Date"
          InputLabelProps={{ shrink: true }}
          value={filterDate}
          onChange={handleFilterChange}
        />
        <Button variant="contained" sx={{backgroundColor:"teal"}} onClick={exportToCSV}>
          Export to CSV
        </Button>
      </Box>
      <Grid container spacing={3}>
        {filteredDeliveries.map((delivery) => (
          <Grid item xs={12} sm={6} md={4} key={delivery.ID}>
            <Card sx={{ borderRadius: 3, boxShadow: 3, p: 2, backgroundColor: '#f9f9f9', cursor: 'pointer' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <CardMedia
                    component="img"
                    image={delivery.EmpPic}
                    alt="Employee"
                    sx={{ width: 50, height: 50, borderRadius: '50%' }}
                    onClick={() => handleImageClick(delivery.EmpPic)}
                  />
                  <Typography variant="h6">{delivery.EmpName}</Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" mt={1}>
                  {delivery.TypeOfDelivery}
                </Typography>
                

                <Box display="flex" sx={{justifyContent:"space-between"}}>

                <Box display="flex" alignItems="center" gap={1} mt={1}>
                  <LocalShippingIcon color="primary" />
                  <Typography variant="body2">Vehicles: {delivery.NumberOfVehicle}</Typography>
                </Box>
                <Box mt={2} display="flex" gap={1}>
                  {[delivery.VehiclePic1, delivery.VehiclePic2, delivery.VehiclePic3, delivery.VehiclePic4, delivery.VehiclePic5]
                    .filter(Boolean)
                    .map((pic, index) => (
                      <IconButton key={index} onClick={() => handleImageClick(pic)}>
                        <ImageIcon />
                      </IconButton>
                    ))}
                </Box>
                </Box>
                <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                  {[delivery.VehicleNo1, delivery.VehicleNo2, delivery.VehicleNo3, delivery.VehicleNo4, delivery.VehicleNo5]
                    .filter(Boolean)
                    .map((vehicle, index) => (
                      <Chip key={index} label={vehicle} variant="outlined" />
                    ))}
                </Box>
                
                
                <Box display="flex" sx={{ justifyContent: "space-between" }} mt={1}>
                  
                  <Typography variant="body2" >
                  Location: {locations[Number(delivery.LocationId)] || `Unknown (ID: ${delivery.LocationId})`}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" >
                  Date: {delivery.Datetime}
                </Typography>
                </Box>
                
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogContent>
          <img src={selectedImage} alt="Preview" style={{ width: '400px' }} />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default DeliveryList;
