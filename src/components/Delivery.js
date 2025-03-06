import React, { useState, useEffect } from "react";
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
  Pagination,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  Paper,
  TableBody,
  Avatar,
} from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import Autocomplete from "@mui/material/Autocomplete";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import GetAppIcon from "@mui/icons-material/GetApp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
const DeliveryList = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [locations, setLocations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
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
      const locationRes = await fetch(
        "https://namami-infotech.com/M&M/src/location/get_location.php",
      );
      const locationData = await locationRes.json();
      if (locationData.success) {
        const locationMap = {};
        locationData.data.forEach((loc) => {
          locationMap[loc.id] = loc.abbrevation;
        });
        setLocations(locationMap);
      }

      // Get user role and location ID
      const user = JSON.parse(localStorage.getItem("user"));
      const role = user?.role?.trim() === "admin" ? "admin" : "";
      const locationId = user?.location_id || "";
      const deliveryUrl = role
        ? "https://namami-infotech.com/M&M/src/delivery/delivery_get.php?role=admin"
        : `https://namami-infotech.com/M&M/src/delivery/delivery_get.php?LocationId=${locationId}`;

      const deliveryRes = await fetch(deliveryUrl);
      const deliveryData = await deliveryRes.json();

      if (deliveryData.status === "success") {
        setDeliveries(deliveryData.data);
        setFilteredDeliveries(deliveryData.data);
        extractDistinctEmpNames(deliveryData.data);
      } else {
        setError(deliveryData.message || "Failed to fetch deliveries");
      }
    } catch (err) {
      setError("Error fetching data");
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
        const deliveryDate = dayjs(d.Datetime.split(" ")[0]);
        return (
          deliveryDate.isAfter(dayjs(fromDate).subtract(1, "day")) &&
          deliveryDate.isBefore(dayjs(toDate).add(1, "day"))
        );
      });
    }

    if (selectedLocation) {
      filtered = filtered.filter(
        (d) => Number(d.LocationId) === selectedLocation,
      );
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
    let csvContent =
      "EmpId,Emp Name,Type of Delivery,Number of Vehicles,Type Of Vehicle, Vehicle Numbers, Packets, Location,Datetime\n";

    filteredDeliveries.forEach((d) => {
      let vehicleNumbers = [
        d.VehicleNo1,
        d.VehicleNo2,
        d.VehicleNo3,
        d.VehicleNo4,
        d.VehicleNo5,
      ]
        .filter(Boolean)
        .join(","); // Ensure vehicle numbers are separated correctly

      let packets = [
        d.Packet1,
        d.Packet2,
        d.Packet3,
        d.Packet4,
        d.Packet5,
      ]
        .filter(Boolean)
        .join(",");
      // Wrap fields containing commas in double quotes
      let row = [
        d.EmpId,
        `"${d.EmpName}"`,
        `"${d.TypeOfDelivery}"`,
        d.NumberOfVehicle,
         `"${d.TypeOfVehicle}"`,
        `"${vehicleNumbers}"`,
        `"${packets}"`,
        `"${locations[d.LocationId] || "Unknown"}"`,
        `"${d.Datetime}"`,
      ].join(",");

      csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "deliveries.csv");
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
  const currentItems = filteredDeliveries.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  const updateStatus = async (id, newStatus) => {
    try {
      const response = await fetch(
        "https://namami-infotech.com/M&M/src/delivery/update_status.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ID: id, Status: newStatus }),
        },
      );

      const result = await response.json();
      if (result.status === "success") {
        setDeliveries((prevDeliveries) =>
          prevDeliveries.map((delivery) =>
            delivery.ID === id ? { ...delivery, Status: newStatus } : delivery,
          ),
        );
        fetchData();
      } else {
        alert(result.message || "Failed to update status");
      }
    } catch (err) {
      alert("Error updating status");
    }
  };

  const handleComplete = (id) => {
    updateStatus(id, "Complete");
  };

  const isCompleteButtonDisabled = (delivery) => {
    if (delivery.Status === "Complete") return true; // Already completed

    const entryTime = dayjs(delivery.Datetime); // Convert string to Day.js object
    const currentTime = dayjs();
    const diffInHours = currentTime.diff(entryTime, "hour");

    return diffInHours < 3; // Disable if less than 3 hours have passed
  };

  const handleDelete = (id) => {
    updateStatus(id, "Delete");
  };
  if (loading) {
    return (
      <Typography variant="h6" align="center">
        Loading...
      </Typography>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" sx={{ justifyContent: "space-between" }} mb={3}>
        <Typography variant="h4" gutterBottom align="center">
          Delivery List
        </Typography>
        {error && (
          <Typography color="error" align="center">
            {error}
          </Typography>
        )}
        <Autocomplete
          value={
            selectedLocation
              ? { id: selectedLocation, name: locations[selectedLocation] }
              : null
          }
          onChange={handleLocationFilterChange}
          options={Object.keys(locations).map((id) => ({
            id,
            name: locations[id],
          }))}
          getOptionLabel={(option) => option.name || ""}
          renderInput={(params) => (
            <TextField {...params} label="Search by Location" fullWidth />
          )}
          sx={{ width: "200px" }}
        />

        <TextField
          type="date"
          label="From Date"
          InputLabelProps={{ shrink: true }}
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />
        <TextField
          type="date"
          label="To Date"
          InputLabelProps={{ shrink: true }}
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />
        <Button
          variant="contained"
          sx={{ backgroundColor: "teal" }}
          onClick={exportToCSV}
        >
          <GetAppIcon /> CSV
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{backgroundColor:"teal",color:"white"}}>Employee</TableCell>
            <TableCell sx={{backgroundColor:"teal",color:"white"}}>Emp ID</TableCell>
            <TableCell sx={{backgroundColor:"teal",color:"white"}}>Delivery Type</TableCell>
            <TableCell sx={{backgroundColor:"teal",color:"white"}}>Vehicle Type</TableCell>
            <TableCell sx={{backgroundColor:"teal",color:"white"}}>Vehicle with Employee</TableCell>
            <TableCell sx={{backgroundColor:"teal",color:"white"}}>Vehicle Numbers</TableCell>
            <TableCell sx={{backgroundColor:"teal",color:"white"}}>Packets</TableCell>
            <TableCell sx={{backgroundColor:"teal",color:"white"}}>Vehicle Images</TableCell>
            <TableCell sx={{backgroundColor:"teal",color:"white"}}>Location</TableCell>
            <TableCell sx={{backgroundColor:"teal",color:"white"}}>Date & Time</TableCell>
            <TableCell sx={{backgroundColor:"teal",color:"white"}}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {currentItems.map((delivery) => (
            <TableRow key={delivery.ID}>
              <TableCell> <Avatar
                  src={delivery.EmpPic}
                  alt="Employee"
                  sx={{ cursor: "pointer" ,boxShadow:
                  delivery.Status === "Complete"
                    ? "5px 5px 5px rgb(76, 181, 76)"
                    : "5px 5px 5px rgb(255, 13, 0)" }}
                  onClick={() => handleImageClick(delivery.EmpPic)}
                /> {delivery.EmpName}</TableCell>
              <TableCell>{delivery.EmpId}</TableCell>
             
              <TableCell>{delivery.TypeOfDelivery}</TableCell>
             
              <TableCell>{delivery.TypeOfVehicle}</TableCell>
              <TableCell>
                <Avatar src={delivery.CombinedVehiclePic} sx={{cursor:"pointer"}} onClick={() => handleImageClick(delivery.CombinedVehiclePic)}/> 
              </TableCell>
              <TableCell>
                {[
                  delivery.VehicleNo1,
                  delivery.VehicleNo2,
                  delivery.VehicleNo3,
                  delivery.VehicleNo4,
                  delivery.VehicleNo5,
                ]
                  .filter(Boolean)
                  .map((vehicle, index) => (
                    <Typography key={index} variant="body2">
                      {vehicle}
                    </Typography>
                  ))}
              </TableCell>
               <TableCell>
                {[
                  delivery.Packet1,
                  delivery.Packet2,
                  delivery.Packet3,
                  delivery.Packet4,
                  delivery.Packet5,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </TableCell>
              <TableCell>
                {[
                  delivery.VehiclePic1,
                  delivery.VehiclePic2,
                  delivery.VehiclePic3,
                  delivery.VehiclePic4,
                  delivery.VehiclePic5,
                ]
                  .filter(Boolean)
                  .map((pic, index) => (
                    <IconButton key={index} onClick={() => handleImageClick(pic)}>
                      <ImageIcon />
                    </IconButton>
                  ))}
              </TableCell>
              <TableCell>
                
                <a
                  href={`https://www.google.com/maps?q=${delivery.LatLong}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none", color: "blue" }}
                >
                  {locations[Number(delivery.LocationId)] || `Unknown (ID: ${delivery.LocationId})`}
                </a>
              </TableCell>
              <TableCell>
                <Typography variant="body2" style={{ fontWeight: "800" }}>
                  {delivery.Datetime}
                </Typography>
              </TableCell>
              <TableCell>
                <IconButton
                  color="success"
                  disabled={isCompleteButtonDisabled(delivery)}
                  onClick={() => handleComplete(delivery.ID)}
                >
                  <CheckCircleIcon />
                </IconButton>
                <IconButton
                  color="error"
                  disabled={delivery.Status === "Complete"}
                  onClick={() => handleDelete(delivery.ID)}
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>

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
          <img src={selectedImage} alt="Preview" style={{ width: "400px" }} />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default DeliveryList;
