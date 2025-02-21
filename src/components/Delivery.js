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
  Button,
  Pagination
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import Autocomplete from '@mui/material/Autocomplete';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';
import GetAppIcon from '@mui/icons-material/GetApp';
const DeliveryList = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [locations, setLocations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
 const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [empNames, setEmpNames] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
 
useEffect(() => {
    fetchData();
  }, []);
  const fetchData = async () => {
  try {
    const locationRes = await fetch('https://namami-infotech.com/M&M/src/location/get_location.php');
    const locationData = await locationRes.json();
    if (locationData.success) {
      const locationMap = {};
      locationData.data.forEach((loc) => {
        locationMap[loc.id] = loc.abbrevation;
      });
      setLocations(locationMap);
    }

    // Get user role and location ID
    const user = JSON.parse(localStorage.getItem('user'));
   const role = user?.role?.trim() === 'admin' ? 'admin' : '';
const locationId = user?.location_id || '';
const deliveryUrl = role
  ? 'https://namami-infotech.com/M&M/src/delivery/delivery_get.php?role=admin'
  : `https://namami-infotech.com/M&M/src/delivery/delivery_get.php?LocationId=${locationId}`;

    const deliveryRes = await fetch(deliveryUrl);
    const deliveryData = await deliveryRes.json();

    if (deliveryData.status === 'success') {
      setDeliveries(deliveryData.data);
      setFilteredDeliveries(deliveryData.data);
      extractDistinctEmpNames(deliveryData.data);
    } else {
      setError(deliveryData.message || 'Failed to fetch deliveries');
    }
  } catch (err) {
    setError('Error fetching data');
  } finally {
    setLoading(false);
  }
};


  // Extract distinct employee names from deliveries
  const extractDistinctEmpNames = (data) => {
    const uniqueNames = [...new Set(data.map((d) => d.EmpName))];
    setEmpNames(uniqueNames);
  };

  const filterDeliveries = () => {
  let filtered = [...deliveries];

  if (fromDate && toDate) {
    filtered = filtered.filter((d) => {
      const deliveryDate = dayjs(d.Datetime.split(' ')[0]);
      return (
        deliveryDate.isAfter(dayjs(fromDate).subtract(1, 'day')) &&
        deliveryDate.isBefore(dayjs(toDate).add(1, 'day'))
      );
    });
  }

  if (selectedLocation) {
    filtered = filtered.filter((d) => Number(d.LocationId) === selectedLocation);
  }

  if (selectedEmp) {
    filtered = filtered.filter((d) => d.EmpName === selectedEmp);
  }

  setFilteredDeliveries(filtered);
  setCurrentPage(1);
};


  const handleLocationFilterChange = (event, newValue) => {
  setSelectedLocation(newValue ? Number(newValue.id) : null);
};


 useEffect(() => {
  filterDeliveries();
}, [fromDate, toDate, selectedEmp, selectedLocation]); // Add `selectedLocation`


  // Filter deliveries based on selected employee name
  const handleEmpFilterChange = (event, newValue) => {
    setSelectedEmp(newValue);

    if (newValue) {
      setFilteredDeliveries(deliveries.filter((d) => d.EmpName === newValue));
    } else {
      setFilteredDeliveries(deliveries);
    }
  };

  const exportToCSV = () => {
    let csvContent = 'EmpId,Emp Name,Type of Delivery,Number of Vehicles,Vehicle Numbers,Location,Datetime\n';
    
    filteredDeliveries.forEach((d) => {
        let vehicleNumbers = [d.VehicleNo1, d.VehicleNo2, d.VehicleNo3, d.VehicleNo4, d.VehicleNo5]
            .filter(Boolean)
            .join(','); // Ensure vehicle numbers are separated correctly

        // Wrap fields containing commas in double quotes
        let row = [
            d.EmpId,
            `"${d.EmpName}"`,
            `"${d.TypeOfDelivery}"`,
            d.NumberOfVehicle,
            `"${vehicleNumbers}"`,
            `"${locations[d.LocationId] || 'Unknown'}"`,
            `"${d.Datetime}"`
        ].join(',');

        csvContent += row + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'deliveries.csv');
};

  

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setOpenDialog(true);
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDeliveries.slice(indexOfFirstItem, indexOfLastItem);
   
  
  if (loading) {
    return <Typography variant="h6" align="center">Loading...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
       <Box display="flex" sx={{justifyContent:"space-between"}} mb={3}>
      <Typography variant="h4" gutterBottom align="center">Delivery List</Typography>
      {error && <Typography color="error" align="center">{error}</Typography>}
      <Autocomplete
  value={selectedLocation ? { id: selectedLocation, name: locations[selectedLocation] } : null}
  onChange={handleLocationFilterChange}
  options={Object.keys(locations).map((id) => ({ id, name: locations[id] }))}
  getOptionLabel={(option) => option.name || ''}
  renderInput={(params) => <TextField {...params} label="Search by Location" fullWidth />}
  sx={{ width: "200px" }}
/>

        
       <TextField type="date" label="From Date" InputLabelProps={{ shrink: true }} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        <TextField type="date" label="To Date" InputLabelProps={{ shrink: true }} value={toDate} onChange={(e) => setToDate(e.target.value)} />
       <Button variant="contained" sx={{backgroundColor:"teal"}} onClick={exportToCSV}>
         <GetAppIcon/>  CSV
        </Button>
      </Box>
      <Grid container spacing={3}>
        {currentItems.map((delivery) => (
          <Grid item xs={12} sm={6} md={4} key={delivery.ID}>
            <Card sx={{ borderRadius: 3, boxShadow: 3, p: 2, backgroundColor: '#f9f9f9', cursor: 'pointer' }}>
              <CardContent>
               
                <Box display="flex" alignItems="center" justifyContent={'space-between'} >
                   <div style={{display:"flex",alignItems:"center", gap:"5px"}}>
                  <CardMedia
                    component="img"
                    image={delivery.EmpPic}
                    alt="Employee"
                    sx={{ width: 50, height: 50, borderRadius: '50%' }}
                    onClick={() => handleImageClick(delivery.EmpPic)}
                    />
                    <div style={{display:"flex",flexDirection:"column"}}>
                    <Typography variant="h6">{delivery.EmpName}</Typography>
                    <Typography variant="p">{delivery.EmpId}</Typography>
                    </div>
                    </div>
                  <CardMedia
                    component="img"
                    image={delivery.CombinedVehiclePic}
                    alt="Employee"
                    sx={{ width: 50, height: 50, borderRadius: '50%' }}
                    onClick={() => handleImageClick(delivery.CombinedVehiclePic)}
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" mt={1}>
                   <Typography variant="body2">Delivery Type: {delivery.TypeOfDelivery}</Typography>
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                   <Typography variant="body2">Vehicle Type: {delivery.TypeOfVehicle}</Typography>
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
                  <Box display="flex" alignItems="center" gap={1} >
                    <LocationOnIcon color="primary"/>
                <Typography variant="body2">
  <a
    href={`https://www.google.com/maps?q=${delivery.LatLong}`}
    target="_blank"
    rel="noopener noreferrer"
    style={{ textDecoration: 'none', color: 'blue' }}
  >
    {locations[Number(delivery.LocationId)] || `Unknown (ID: ${delivery.LocationId})`}
  </a>
</Typography>

                </Box>
                <Typography variant="body2" color="text.secondary" >
                  Date: {delivery.Datetime}
                </Typography>
                </Box>
                
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Box display="flex" justifyContent="center" mt={3}>
        <Pagination
          count={Math.ceil(filteredDeliveries.length / itemsPerPage)}
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogContent>
          <img src={selectedImage} alt="Preview" style={{ width: '400px' }} />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default DeliveryList;
