import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Dialog,
  DialogContent,
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
} from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import Autocomplete from "@mui/material/Autocomplete";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import GetAppIcon from "@mui/icons-material/GetApp";

const Return = () => {
  const [returns, setReturns] = useState([]);
  const [filteredReturns, setFilteredReturns] = useState([]);
  const [locations, setLocations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [matchStatusFilter, setMatchStatusFilter] = useState("All");

  const getMatchStatus = (returnItem) => {
    return returnItem.VehicleNumber === returnItem.ManualNumber ? "OK" : "Not OK";
  };

  const itemsPerPage = 15;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch locations
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
      
      const returnUrl = role
        ? "https://namami-infotech.com/M&M/src/return/get_return.php?role=admin"
        : `https://namami-infotech.com/M&M/src/return/get_return.php?LocationId=${locationId}`;

      const returnRes = await fetch(returnUrl);
      const returnData = await returnRes.json();

      if (returnData.status === "success") {
        setReturns(returnData.data);
        setFilteredReturns(returnData.data);
      } else {
        setError(returnData.message || "Failed to fetch returns");
      }
    } catch (err) {
      setError("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  const filterReturns = () => {
    let filtered = [...returns];

    if (fromDate && toDate) {
      filtered = filtered.filter((r) => {
        const returnDate = dayjs(r.DateTime.split(" ")[0]);
        return (
          returnDate.isAfter(dayjs(fromDate).subtract(1, "day")) &&
          returnDate.isBefore(dayjs(toDate).add(1, "day"))
        );
      });
    }

    if (selectedLocation) {
      filtered = filtered.filter(
        (r) => Number(r.LocationId) === selectedLocation,
      );
    }

    if (matchStatusFilter !== "All") {
      filtered = filtered.filter((r) => getMatchStatus(r) === matchStatusFilter);
    }

    setFilteredReturns(filtered);
    setCurrentPage(1);
  };

  const handleLocationFilterChange = (event, newValue) => {
    setSelectedLocation(newValue ? Number(newValue.id) : null);
  };

  useEffect(() => {
    filterReturns();
  }, [fromDate, toDate, selectedLocation, matchStatusFilter]);

  const exportToCSV = () => {
    let csvContent = "Vehicle Number,Manual Number,No. of Packets,Location,Date & Time,Status\n";

    filteredReturns.forEach((r) => {
      const status = r.VehicleNumber === r.ManualNumber ? "OK" : "Not OK";
      const row = [
        `"${r.VehicleNumber}"`,
        `"${r.ManualNumber}"`,
        r.NoOfPackets,
        `"${locations[r.LocationId] || "Unknown"}"`,
        `"${r.DateTime}"`,
        status,
      ].join(",");

      csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "returns.csv");
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
  const currentItems = filteredReturns.slice(indexOfFirstItem, indexOfLastItem);

  



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
          Return List
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
        <Autocomplete
          options={["All", "OK", "Not OK"]}
          value={matchStatusFilter}
          onChange={(event, newValue) => setMatchStatusFilter(newValue || "All")}
          renderInput={(params) => (
            <TextField {...params} label="Match Status" fullWidth />
          )}
          sx={{ width: "180px" }}
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
              <TableCell sx={{backgroundColor:"teal",color:"white"}}>Sr No.</TableCell>
              <TableCell sx={{backgroundColor:"teal",color:"white"}}>Vehicle Number</TableCell>
              <TableCell sx={{backgroundColor:"teal",color:"white"}}>Manual Number</TableCell>
              <TableCell sx={{backgroundColor:"teal",color:"white"}}>No. of Packets</TableCell>
              <TableCell sx={{backgroundColor:"teal",color:"white"}}>Vehicle</TableCell>
              <TableCell sx={{backgroundColor:"teal",color:"white"}}>Vehicle Image</TableCell>
              <TableCell sx={{backgroundColor:"teal",color:"white"}}>Location</TableCell>
              <TableCell sx={{backgroundColor:"teal",color:"white"}}>Date & Time</TableCell>
              <TableCell sx={{backgroundColor:"teal",color:"white"}}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentItems.map((returnItem, index) => (
              <TableRow key={returnItem.ID}>
                <TableCell>
                  {filteredReturns.length - (indexOfFirstItem + index)}
                </TableCell>
                <TableCell>{returnItem.VehicleNumber}</TableCell>
                <TableCell
                  sx={{
                    color: returnItem.VehicleNumber === returnItem.ManualNumber ? "green" : "red",
                    fontWeight: "bold",
                  }}
                >
                  {returnItem.ManualNumber}
                </TableCell>
                <TableCell>{returnItem.NoOfPackets}</TableCell>
                <TableCell>
                   <img
          style={{width:"70px", height: "70px", borderRadius: "5px", cursor: "pointer"}}
          src={returnItem.Pic}
          sx={{ cursor: "pointer" }}
         onClick={() => handleImageClick(returnItem.Pic)}
          alt="Vehicle"
        />
                  
                </TableCell>
                <TableCell>
                   <img
          style={{width:"70px", height: "70px", borderRadius: "5px", cursor: "pointer"}}
          src={returnItem.Combined_Pic}
          sx={{ cursor: "pointer" }}
         onClick={() => handleImageClick(returnItem.Combined_Pic)}
          alt="Combined Pic"
        />
                </TableCell>
                <TableCell>
                  <a
                    href={`https://www.google.com/maps?q=${returnItem.LatLong}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: "none", color: "blue" }}
                  >
                    {locations[Number(returnItem.LocationId)] || `Unknown (ID: ${returnItem.LocationId})`}
                  </a>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" style={{ fontWeight: "800" }}>
                    {returnItem.DateTime}
                  </Typography>
                </TableCell>
                <TableCell>
                  {getMatchStatus(returnItem) === "OK" ? (
                    <span style={{ color: "green", fontWeight: "bold" }}>OK</span>
                  ) : (
                    <span style={{ color: "red", fontWeight: "bold" }}>Not OK</span>
                  )}
                </TableCell>
                
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box display="flex" justifyContent="center" mt={3}>
        <Pagination
          count={Math.ceil(filteredReturns.length / itemsPerPage)}
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

export default Return;